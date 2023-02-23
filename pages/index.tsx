import * as React from "react";
import {
  Badge,
  ChakraProvider,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
} from "@chakra-ui/react";
import Head from "next/head";
import { useState } from "react";
import { Container, Button, Box, Text } from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";
import styles from "../styles/Home.module.css";
import { CellCard } from "../components/CellCard";
import {
  BI,
  Cell,
  config,
  helpers,
  Indexer,
  RPC,
  Script,
  WitnessArgs,
} from "@ckb-lumos/lumos";
import { bytes } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [ckb, setCkb] = useState<any>();
  const [balance, setBalance] = useState(0);
  const [fullCells, setFullCells] = useState<Array<Cell>>([]);
  const [receiver, serReceiver] = useState("");
  const [receiverLock, serReceiverLock] = useState<Script>();
  const [tansferAmount, setTansferAmount] = useState<number>();
  const [receiveAddress, setReceiveAddress] = useState("");

  config.initializeConfig(config.predefined.AGGRON4);
  async function handleRefreshBalance() {
    if (!ckb) {
      return;
    }
    let res = 0;
    const fullCells = (await ckb.fullOwnership.getLiveCells({})).objects;
    fullCells.forEach((cell) => {
      res += Number(cell.cellOutput.capacity);
    });
    setFullCells(fullCells);
    setBalance(res);
  }

  async function handleReceiverChange(e) {
    const receiverAddress = e.target.value;
    serReceiver(receiverAddress);
    try {
      const receiverLock = helpers.parseAddress(receiverAddress);
      serReceiverLock(receiverLock);
    } catch (error) {}
  }

  async function handleTransfer() {
    const changeLock: Script = (
      await ckb.fullOwnership.getOffChainLocks({ change: "internal" })
    )[0];
    console.log("changeLock", changeLock);
    console.log("target address", receiver);
    console.log("target lock", receiverLock);
    console.log("transfer amount", tansferAmount);
    const preparedCells = [];
    const transferAmountBI = BI.from(tansferAmount).mul(10 ** 8);
    let prepareAmount = BI.from(0);
    for (let i = 0; i < fullCells.length; i++) {
      const cellCkbAmount = BI.from(fullCells[i].cellOutput.capacity);
      preparedCells.push(fullCells[i]);
      prepareAmount = prepareAmount.add(cellCkbAmount);
      if (prepareAmount.gte(transferAmountBI)) {
        break;
      }
    }
    const indexer = new Indexer("https://testnet.ckb.dev");
    let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
    txSkeleton = txSkeleton.update("inputs", (inputs) => {
      return inputs.concat(...preparedCells);
    });

    const outputCells: Cell[] = [];
    outputCells[0] = {
      cellOutput: {
        capacity: transferAmountBI.toHexString(),
        lock: receiverLock,
      },
      data: "0x",
    };
    outputCells[1] = {
      cellOutput: {
        // change amount = prepareAmount - transferAmount - 1000 shannons for tx fee
        capacity: prepareAmount.sub(transferAmountBI).sub(1000).toHexString(),
        lock: changeLock,
      },
      data: "0x",
    };
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.concat(...outputCells);
    });

    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.concat({
        outPoint: {
          txHash: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        depType: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      });
    });
    for (let i = 0; i < preparedCells.length; i++) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    const witnessArgs: WitnessArgs = {
      /* 65-byte zeros in hex */
      lock: "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    };
    const secp256k1Witness = bytes.hexify(
      blockchain.WitnessArgs.pack(witnessArgs)
    );
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(0, secp256k1Witness)
    );

    const tx = helpers.createTransactionFromSkeleton(txSkeleton);
    console.log("tx to sign:", tx);

    const signatures: any[] = await ckb.fullOwnership.signTransaction({ tx });
    console.log("signatures", signatures);
    for (let index = 0; index < signatures.length; index++) {
      const [lock, sig] = signatures[index];
      const newWitnessArgs: WitnessArgs = {
        lock: sig,
      };
      const newWitness = bytes.hexify(
        blockchain.WitnessArgs.pack(newWitnessArgs)
      );
      tx.witnesses[index] = newWitness;
    }
    console.log("tx to send on chain", tx);
    const rpc = new RPC("https://testnet.ckb.dev");
    const txHash = await rpc.sendTransaction(tx);
    console.log("txHash", txHash);
  }
  async function handleClick() {
    const windowCKB = (window as any).ckb;
    if (!windowCKB) {
      console.log("no nexus wallet found!");
      return;
    }
    const ckb = await windowCKB.enable();
    setCkb(ckb);
  }
  async function handleCreateReceiveAddress() {
    if (!ckb) {
      return;
    }
    const nextLock = (await ckb.fullOwnership.getOffChainLocks({}))[0];
    const nextAddress = helpers.generateAddress(nextLock);
    console.log("next lock", nextLock);
    console.log("next address", nextAddress);
    setReceiveAddress(nextAddress);
  }
  function parse(valueString: string): React.SetStateAction<number> {
    return Number(valueString);
  }

  return (
    <ChakraProvider>
      <Container>
        <div className={styles.container}>
          <Head>
            <title>Demo Nexus</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <Text fontSize='4xl'>Full Ownership Demo</Text>
          <div className={styles.connect}>
            {!!ckb ? (
              <Badge fontSize='xl' fontStyle='italic'>
                Connected {"  "}
                <CheckCircleIcon color="green.500" />
              </Badge>
            ) : (
              <Badge>
                {" "}
                <Button onClick={handleClick}>Connect Wallet</Button>
              </Badge>
            )}
          </div>
          <Text fontSize='xl' fontWeight={500} marginBottom='1rem'>CKB BALANCE: {(balance/(10 ** 8)).toFixed(2)}</Text>
          <Button onClick={handleRefreshBalance}>refresh</Button>
          <Box maxHeight='32rem' overflowY='scroll'>
            {fullCells.map((cell, i) => {
              return <CellCard {...cell} key={i} />;
            })}
          </Box>

          <FormControl>
            <FormLabel>Transfer To:</FormLabel>
            <Input
              type="text"
              value={receiver}
              onChange={handleReceiverChange}
            />
            <FormLabel marginTop={2}>Transfer Amount:</FormLabel>
            <NumberInput
              onChange={(valueString) => setTansferAmount(parse(valueString))}
              value={tansferAmount}
            >
              <NumberInputField />
            </NumberInput>
            <Button marginTop={4} onClick={handleTransfer}>Transfer</Button>
          </FormControl>

          <Box width='100%' border='1px' borderColor='gray.200' borderRadius={4} marginTop={4} padding={4}
          textAlign='center' lineHeight='40px'>
            <Text fontSize='2xl' fontWeight={500}> RECEIVE </Text>
            <Button onClick={handleCreateReceiveAddress}>Create</Button>
            <Text>{receiveAddress}</Text>
          </Box>
          <style jsx>{`
            main {
              padding: 5rem 0;
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            footer {
              width: 100%;
              height: 100px;
              border-top: 1px solid #eaeaea;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            footer img {
              margin-left: 0.5rem;
            }
            footer a {
              display: flex;
              justify-content: center;
              align-items: center;
              text-decoration: none;
              color: inherit;
            }
            code {
              background: #fafafa;
              border-radius: 5px;
              padding: 0.75rem;
              font-size: 1.1rem;
              font-family: Menlo, Monaco, Lucida Console, Liberation Mono,
                DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New,
                monospace;
            }
          `}</style>

          <style jsx global>{`
            html,
            body {
              padding: 0;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
                Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
                sans-serif;
            }
            * {
              box-sizing: border-box;
            }
          `}</style>
        </div>
      </Container>
    </ChakraProvider>
  );
}
