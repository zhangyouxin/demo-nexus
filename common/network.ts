import { config } from "@ckb-lumos/lumos";

export interface NetworkConfig {
  id: string;
  displayName: string;
  networkName: string;
  rpcUrl: string;
}

export interface NetworkScriptConfig {
  config: config.Config;
}

export interface NetworkInfo extends NetworkConfig, NetworkScriptConfig {}

export const DEFAULT_NETWORKS: NetworkConfig[] = [
  {
    id: "mainnet",
    networkName: "ckb",
    displayName: "Mainnet",
    rpcUrl: "https://mainnet.ckb.dev",
  },
  {
    id: "testnet",
    networkName: "ckb_testnet",
    displayName: "Testnet",
    rpcUrl: "https://testnet.ckb.dev",
  },
  {
    id: "devnet",
    networkName: "ckb_devnet",
    displayName: "Devnet",
    rpcUrl: "http://localhost:8114",
  },
];
