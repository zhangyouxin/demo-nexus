import { type Cell, type Script } from '@ckb-lumos/lumos';

export type NCell = Cell & { address: string };
export interface NScript {
  lock: Script
  address: string
}

export interface TransferBookItem {
  txHash: string
  to: string
  amount: string
  time: string
  description?: string
}
