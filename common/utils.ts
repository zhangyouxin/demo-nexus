import { BI, HexNumber } from "@ckb-lumos/lumos";
export const formatDisplayCapacity = (capacity: BI | HexNumber) => {
  return (Math.floor(BI.from(capacity).toNumber() / 10 ** 6) / 100).toFixed(2);
};

export const formatDisplayAddress = (address: string) => {
  if (address.length <= 16) return address;
  return address.slice(0, 10) + "..." + address.slice(-6);
};
export const formatDisplayHash = (hash: string) => {
  if (hash.length <= 14) return hash;
  return hash.slice(0, 8) + "..." + hash.slice(-6);
};
