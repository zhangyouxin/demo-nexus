import { Cell, Script } from "@ckb-lumos/lumos";
import { log } from 'console';

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

  fullCells = fullCells.filter(item => item.cellOutput.type == undefined);

  return fullCells;
};
