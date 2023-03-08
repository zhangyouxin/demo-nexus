import { Script } from "@ckb-lumos/lumos";
export const getOffChainLocks = async (ckb: any) => {
  return await ckb.fullOwnership.getOffChainLocks({});
};

export const getOnChainLocks = async (
  ckb: any,
  type: "external" | "internal"
) => {
  let locks: Script[] = [];
  let onChainInfos = await ckb.fullOwnership.getOnChainLocks({ change: type });
  locks.push(...onChainInfos.objects);
  while (onChainInfos.objects.length === 20) {
    onChainInfos = await ckb.fullOwnership.getOnChainLocks({
      cursor: onChainInfos.cursor,
      change: type,
    });
    locks.push(...onChainInfos.objects);
  }
  return locks;
};
