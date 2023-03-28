import { Cell, Script } from "@ckb-lumos/lumos";

export const DEFAULT_NEXUS_PAGE_SIZE = 20;

export const getOffChainLocks = async (ckb: any) => {
  return await ckb.fullOwnership.getOffChainLocks({});
};

export const getOnChainLocks = async (
  ckb: any,
  type: "external" | "internal"
) => {
  let locks: Script[] = [];
  // get first page
  let onChainInfos = await ckb.fullOwnership.getOnChainLocks({ change: type });
  locks.push(...onChainInfos.objects);
  // if the first page has DEFAULT_NEXUS_PAGE_SIZE items, then there are more pages, nexus default page size is DEFAULT_NEXUS_PAGE_SIZE
  while (onChainInfos.objects.length === DEFAULT_NEXUS_PAGE_SIZE) {
    onChainInfos = await ckb.fullOwnership.getOnChainLocks({
      cursor: onChainInfos.cursor,
      change: type,
    });
    locks.push(...onChainInfos.objects);
  }
  return locks;
};

export const getAllLiveCells = async (ckb: any): Promise<Cell[]> => {
  let fullCells: Cell[] = [];
  // get first page of live cells
  let liveCellsResult = await ckb.fullOwnership.getLiveCells({});
  fullCells.push(...liveCellsResult.objects);
  // if the first page has DEFAULT_NEXUS_PAGE_SIZE items, then there are more pages, nexus default page size is DEFAULT_NEXUS_PAGE_SIZE
  while (liveCellsResult.objects.length === DEFAULT_NEXUS_PAGE_SIZE) {
    liveCellsResult = await ckb.fullOwnership.getLiveCells({
      cursor: liveCellsResult.cursor,
    });
    fullCells.push(...liveCellsResult.objects);
  }

  // filter pure CKB cell
  fullCells = fullCells.filter(
    (item) =>
      item.cellOutput.type === undefined &&
      item.data === "0x" &&
      // secp256k1 code hash, refer to:
      // https://github.com/nervosnetwork/rfcs/blob/5ccfef8a5e51c6f13179452d3589f247eae55554/rfcs/0024-ckb-genesis-script-list/0024-ckb-genesis-script-list.md#secp256k1blake160
      item.cellOutput.lock.codeHash ===
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8" &&
      item.cellOutput.lock.hashType === "type"
  );

  return fullCells;
};
