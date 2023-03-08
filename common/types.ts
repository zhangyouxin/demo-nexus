import { Cell, Script } from '@ckb-lumos/lumos';

export type NCell = Cell & { address: string };
export type NScript = { lock:Script,  address: string };