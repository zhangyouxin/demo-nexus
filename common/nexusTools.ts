import { Cell, Script } from "@ckb-lumos/lumos";
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
  // if the first page has 20 items, then there are more pages, nexus default page size is 20
  while (onChainInfos.objects.length === 20) {
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
  // if the first page has 20 items, then there are more pages, nexus default page size is 20
  while (liveCellsResult.objects.length === 20) {
    liveCellsResult = await ckb.fullOwnership.getLiveCells({
      cursor: liveCellsResult.cursor,
    });
    fullCells.push(...liveCellsResult.objects);
  }
  return fullCells;
};
