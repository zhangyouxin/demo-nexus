import { BI, HexNumber, Script } from "@ckb-lumos/lumos";
import { DEFAULT_TX_FEE } from "./const";
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

type ValidateResult = {
  code: number;
  message: string;
};

export const validateTransferAmount = (payload: {
  tansferAmount: number;
  balance: BI;
  transferToLock: Script;
}): ValidateResult => {
  if (isNaN(Number(payload.tansferAmount))) {
    return {
      code: 1,
      message: "Transfer amount must be a valid number.",
    };
  }
  if (payload.tansferAmount < 64) {
    return {
      code: 2,
      message: "Transfer amount must be no less than 64.",
    };
  }
  if (
    payload.balance
      .sub(DEFAULT_TX_FEE)
      .sub(BI.from(payload.tansferAmount).mul(10 ** 8))
      .lt(0)
  ) {
    return {
      code: 3,
      message:
        "Balance is not enough (need to pay transaction fee and 64 CKBs for change cell).",
    };
  }
  if (!payload.transferToLock || !payload.transferToLock.args) {
    return {
      code: 4,
      message: "Transfer to address is not valid.",
    };
  }
  return {
    code: 0,
    message: "",
  };
};
