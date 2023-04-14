import * as React from "react";
import {
  Badge,
  ChakraProvider,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
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
import {
  floatStringToShannon,
  formatDisplayCapacity,
  formatInputNumber,
  validateTransferAmount,
} from "../common/utils";
import { ClaimTestnetToken } from "../components/ClaimTestnetToken";
import { TransferTips } from "../components/TransferTips";
import { buildTranferTx } from "../common/txBuilder";
import { NetworkSelect } from "../components/NetworkSelect";
import { useNetworkConfig } from "../hooks/useNetworkConfig";

declare global {
  interface Window {
    ckb: any;
  }
}

export default function Home() {
  const [transferBookItems, setTransferBookItems, removeTransferBookItems] =
    useLocalStorage("nexus-transfer-book", []);
  const [ckb, setCkb] = useState<any>();
  const [balance, setBalance] = useState(BI.from(0));
  const [transferAllFlag, setTransferAllFlag] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transfering, setTransfering] = useState(false);
  const [fullCells, setFullCells] = useState<Array<NCell>>([]);
  const [transferToAddress, setTransferToAddress] = useState("");
  const [description, setDescription] = useState("");
  const [transferToLock, setTransferToLock] = useState<Script>();
  const [tansferAmount, setTansferAmount] = useState<string>();
  const [offChainLockInfos, setOffChainLockInfos] = useState<Array<NScript>>(
    []
  );
  const [onChainLockInfos, setOnChainLockInfos] = useState<Array<NScript>>([]);
  const network = useNetworkConfig();

  const toast = useToast();
  useEffect(() => {
    handleConnect();
  }, []);
  useEffect(() => {
    handleRefresh();
  }, [ckb]);

  async function handleConnect() {
    const windowCKB = (window as any).ckb;
    if (!windowCKB) {
      console.log("no nexus wallet found!");
      return;
    }
    const ckb = await windowCKB.enable();
    setCkb(ckb);
  }

  function handleTransferAll() {
    setTansferAmount(formatDisplayCapacity(balance));
    setTransferAllFlag(true);
  }

  async function handleRefresh(): Promise<Cell[]> {
    if (!ckb || network.loading) {
      return;
    }
    setRefreshing(true);
    try {
      let res = BI.from(0);
      let fullCells: Array<Cell> = await getAllLiveCells(ckb);
      fullCells.forEach((cell) => {
        res = res.add(cell.cellOutput.capacity);
      });
      const networkConfig = network.data.config;
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
    if (!ckb || network.loading) {
      return;
    }
    const receiverAddress = e.target.value;
    setTransferToAddress(receiverAddress);
    try {
      const receiverLock = helpers.parseAddress(receiverAddress, {
        config: network.data.config,
      });
      setTransferToLock(receiverLock);
    } catch (error) {
      console.log("handleReceiverChange error", error);
    }
  }

  async function handleTransfer() {
    if (!ckb || network.loading) {
      return;
    }
    const validateResult = validateTransferAmount({
      tansferAmount,
      balance,
      transferToLock,
      isTransferAll: transferAllFlag,
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
      const { tx, txSkeleton } = buildTranferTx({
        transferAmountBI: floatStringToShannon(tansferAmount),
        network: network.data,
        transferToLock,
        collectedCells: newFullCells,
        changeLock: changeLock,
        isTransferAll: transferAllFlag,
      });
      console.log("tx to sign:", tx);

      const signatures: any[] = await window.ckb.request({
        method: "wallet_fullOwnership_signTransaction",
        params: { tx },
      });
      console.log("signatures", signatures);
      const inputCells = txSkeleton.get("inputs").toArray();
      const inputArgs = inputCells.map((cell) => cell.cellOutput.lock.args);
      for (let index = 0; index < signatures.length; index++) {
        const [lock, sig] = signatures[index];
        const newWitnessArgs: WitnessArgs = {
          lock: sig,
        };
        const newWitness = bytes.hexify(
          blockchain.WitnessArgs.pack(newWitnessArgs)
        );
        const inputIndex = inputArgs.findIndex((arg) => arg === lock.args);
        tx.witnesses[inputIndex] = newWitness;
      }
      console.log("tx to send on chain", tx);
      const rpc = new RPC(network.data.rpcUrl);
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
              textDecor="underline"
            >
              EXPLORER
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
            <Box display="inline-block" mr={4}>
              <NModal title="Switch Network" buttonText="Switch" size="sm">
                <NetworkSelect />
              </NModal>
            </Box>
            {!!ckb ? (
              <Badge fontSize="xl" fontStyle="italic">
                {network.loading ? (
                  "Connecting..."
                ) : (
                  <>
                    Connected to {network.data.displayName}
                    <CheckCircleIcon color="green.500" ml={2} />
                    {network.data.id === "testnet" && <ClaimTestnetToken />}
                  </>
                )}
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
              <TransferTips />
            </FormLabel>
            <InputGroup width="100%">
              <NumberInput
                onChange={(valueString) => {
                  const res = formatInputNumber(valueString);
                  if (res.code === 0) {
                    setTansferAmount(res.value);
                    setTransferAllFlag(false);
                  }
                }}
                value={tansferAmount}
                marginBottom={2}
                width="100%"
              >
                <NumberInputField />
                <InputRightElement width="5rem" mr={2}>
                  <Button h="1.75rem" size="sm" onClick={handleTransferAll}>
                    Tranfer All
                  </Button>
                </InputRightElement>
              </NumberInput>
            </InputGroup>

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
