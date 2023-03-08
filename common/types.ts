import { Cell, Script } from "@ckb-lumos/lumos";

export type NCell = Cell & { address: string };
export type NScript = { lock: Script; address: string };

export type TransferBookItem = {
  txHash: string;
  to: string;
  amount: string;
  time: string;
  description?: string;
};
