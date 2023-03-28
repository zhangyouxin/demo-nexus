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
import { useEffect, useState } from "react";
import { Container, Button, Box, Text, useToast, Link } from "@chakra-ui/react";
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
import { DownloadInfoButton } from "../components/DownloadInfoButton";
import { NModal } from "../components/NModal";
import { AddressBook } from "../components/AddressBook";
import { NCell, NScript } from "../common/types";
import {
  getAllLiveCells,
  getOffChainLocks,
  getOnChainLocks,
} from "../common/nexusTools";
import { useLocalStorage } from "react-use";
import { TransferBook } from "../components/TransferBook";
import { formatDisplayCapacity, validateTransferAmount } from "../common/utils";
import { DEFAULT_TX_FEE } from "../common/const";

export default function Home() {
  const [transferBookItems, setTransferBookItems, removeTransferBookItems] =
    useLocalStorage("nexus-transfer-book", []);
  const [ckb, setCkb] = useState<any>();
  const [balance, setBalance] = useState(BI.from(0));
  const [refreshing, setRefreshing] = useState(false);
  const [transfering, setTransfering] = useState(false);
  const [fullCells, setFullCells] = useState<Array<NCell>>([]);
  const [transferToAddress, setTransferToAddress] = useState("");
  const [description, setDescription] = useState("");
  const [transferToLock, setTransferToLock] = useState<Script>();
  const [tansferAmount, setTansferAmount] = useState<number>();
  const [offChainLockInfos, setOffChainLockInfos] = useState<Array<NScript>>(
    []
  );
  const [onChainLockInfos, setOnChainLockInfos] = useState<Array<NScript>>([]);

  const toast = useToast();
  useEffect(() => {
    handleConnect();
  }, []);
  useEffect(() => {
    handleRefresh();
  }, [ckb]);

  // TODO make config configurable
  config.initializeConfig(config.predefined.AGGRON4);
  async function getConfig(): Promise<config.Config> {
    // TODO return ckb.configService.getConfig();
    return Promise.resolve(config.getConfig());
  }
  async function handleRefresh(): Promise<Cell[]> {
    if (!ckb) {
      return;
    }
    setRefreshing(true);
    try {
      let res = BI.from(0);
      let fullCells: Array<Cell> = await getAllLiveCells(ckb);

      fullCells.forEach((cell) => {
        res = res.add(cell.cellOutput.capacity);
      });
      const networkConfig = await getConfig();
      const fullNCells = fullCells.map((cell): NCell => {
        return {
          ...cell,
          address: helpers.encodeToAddress(cell.cellOutput.lock, {
            config: networkConfig,
          }),
        };
      });
      const offChainLocks: Script[] = await getOffChainLocks(ckb);
      const onChainExternalLocks: Script[] = await getOnChainLocks(
        ckb,
        "external"
      );
      const onChainInternalLocks: Script[] = await getOnChainLocks(
        ckb,
        "internal"
      );

      setOffChainLockInfos(
        offChainLocks.map(
          (lock): NScript => ({
            lock,
            address: helpers.encodeToAddress(lock, { config: networkConfig }),
          })
        )
      );
      setOnChainLockInfos(
        [...onChainExternalLocks, ...onChainInternalLocks].map(
          (lock): NScript => ({
            lock,
            address: helpers.encodeToAddress(lock, { config: networkConfig }),
          })
        )
      );
      setFullCells(fullNCells);
      setBalance(res);
      setRefreshing(false);
      return fullCells;
    } catch (error) {
      setRefreshing(false);
      console.log("handleRefreshBalance error", error);
    }
  }

  async function handleReceiverChange(e) {
    const receiverAddress = e.target.value;
    setTransferToAddress(receiverAddress);
    try {
      const receiverLock = helpers.parseAddress(receiverAddress);
      setTransferToLock(receiverLock);
    } catch (error) {
      console.log("handleReceiverChange error", error);
    }
  }

  async function handleTransfer() {
    if (!ckb) {
      return;
    }
    const validateResult = validateTransferAmount({
      tansferAmount,
      balance,
      transferToLock,
    });
    if (validateResult.code) {
      toast({
        title: "Error",
        description: validateResult.message,
        status: "error",
        duration: 3_000,
        isClosable: true,
      });
      return;
    }
    setTransfering(true);
    try {
      const newFullCells = await handleRefresh();
      const changeLock: Script = (
        await ckb.fullOwnership.getOffChainLocks({ change: "internal" })
      )[0];
      console.log("changeLock", changeLock);
      console.log("target address", transferToAddress);
      console.log("target lock", transferToLock);
      console.log("transfer amount", tansferAmount);
      const preparedCells = [];
      const transferAmountBI = BI.from(tansferAmount).mul(10 ** 8);
      let prepareAmount = BI.from(0);
      for (let i = 0; i < newFullCells.length; i++) {
        const cellCkbAmount = BI.from(newFullCells[i].cellOutput.capacity);
        preparedCells.push(newFullCells[i]);
        prepareAmount = prepareAmount.add(cellCkbAmount);
        if (
          prepareAmount
            .sub(1000)
            .sub(64 * 10 ** 8)
            .gte(transferAmountBI)
        ) {
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
          lock: transferToLock,
        },
        data: "0x",
      };
      outputCells[1] = {
        cellOutput: {
          // change amount = prepareAmount - transferAmount - DEFAULT_TX_FEE shannons for tx fee
          capacity: prepareAmount
            .sub(transferAmountBI)
            .sub(DEFAULT_TX_FEE)
            .toHexString(),
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
            txHash:
              config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
            index: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.INDEX,
          },
          depType:
            config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
        });
      });
      for (let i = 0; i < preparedCells.length; i++) {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.push("0x")
        );
      }
      const witnessArgs: WitnessArgs = {
        lock: bytes.hexify(new Uint8Array(65)),
      };
      const secp256k1Witness = bytes.hexify(
        blockchain.WitnessArgs.pack(witnessArgs)
      );
      for (let i = 0; i < preparedCells.length; i++) {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.set(i, secp256k1Witness)
        );
      }
      console.log(
        "txSkeleton",
        helpers.transactionSkeletonToObject(txSkeleton)
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
      setTransferBookItems((prev) => [
        {
          txHash,
          to: transferToAddress,
          amount: tansferAmount,
          time: new Date().toLocaleString(),
          description,
        },
        ...prev,
      ]);

      toast({
        title: "Transaction has been sent.",
        description: (
          <>
            Visit{" "}
            <Link
              href={`https://pudge.explorer.nervos.org/transaction/${txHash}`}
            >
              <Text fontStyle="initial" fontWeight={500}>
                explorer
              </Text>
            </Link>{" "}
            to check tx status.
          </>
        ),
        status: "success",
        duration: 60_000,
        isClosable: true,
      });
    } catch (error) {
      console.log("handleTransfer error", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 60_000,
        isClosable: true,
      });
    }
    setTransfering(false);
  }
  async function handleConnect() {
    const windowCKB = (window as any).ckb;
    if (!windowCKB) {
      console.log("no nexus wallet found!");
      return;
    }
    const ckb = await windowCKB.enable();
    setCkb(ckb);
  }

  function parseNumber(valueString: string): React.SetStateAction<number> {
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

          <Text fontSize="4xl">
            Full Ownership Demo <DownloadInfoButton />
          </Text>
          <div className={styles.connect}>
            {!!ckb ? (
              <Badge fontSize="xl" fontStyle="italic">
                Connected {"  "}
                <CheckCircleIcon color="green.500" />
              </Badge>
            ) : (
              <Badge>
                {" "}
                <Button onClick={handleConnect} colorScheme="teal">
                  Connect Wallet
                </Button>
              </Badge>
            )}
          </div>
          <Text fontSize="xl" fontWeight={500} marginBottom="1rem">
            BALANCE: {formatDisplayCapacity(balance)} CKB
            <Button
              onClick={handleRefresh}
              isLoading={refreshing}
              marginLeft={4}
            >
              Refresh
            </Button>
          </Text>

          <Box maxHeight="24rem" overflowY="auto" marginBottom={4}>
            {fullCells.length === 0 && <Text>No live cells found yet.</Text>}
            {fullCells.map((cell, i) => {
              return <CellCard {...cell} key={i} />;
            })}
          </Box>

          <FormControl>
            <FormLabel>
              Transfer To<span style={{ color: "red" }}>*</span>:
            </FormLabel>
            <Input
              type="text"
              value={transferToAddress}
              onChange={handleReceiverChange}
              marginBottom={2}
            />
            <FormLabel>
              Transfer Amount<span style={{ color: "red" }}>*</span>:
            </FormLabel>
            <NumberInput
              onChange={(valueString) =>
                setTansferAmount(parseNumber(valueString))
              }
              value={tansferAmount}
              marginBottom={2}
            >
              <NumberInputField />
            </NumberInput>
            <FormLabel>Description:</FormLabel>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              marginBottom={2}
            />

            <Box display="flex" gap={4}>
              <Button onClick={handleTransfer} isLoading={transfering}>
                Transfer
              </Button>
              <NModal title="Transfer Book">
                <TransferBook />
              </NModal>

              <NModal title="Address Book">
                <AddressBook
                  offChainLockInfos={offChainLockInfos}
                  onChainLockInfos={onChainLockInfos}
                  cells={fullCells}
                />
              </NModal>
            </Box>
          </FormControl>
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
