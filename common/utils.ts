import { BI, type HexNumber, type Script } from '@ckb-lumos/lumos';
import { DEFAULT_TX_FEE, MIN_TRANSFER_AMOUNT } from './const';
export const formatDisplayCapacity = (capacity: BI | HexNumber) => {
  return (Math.floor(BI.from(capacity).toNumber() / 10 ** 6) / 100).toFixed(2);
};

export const formatDisplayAddress = (address: string) => {
  if (address.length <= 16) return address;
  return address.slice(0, 10) + '...' + address.slice(-6);
};
export const formatDisplayHash = (hash: string) => {
  if (hash.length <= 14) return hash;
  return hash.slice(0, 8) + '...' + hash.slice(-6);
};

interface FormatInputNumberResult {
  code: number
  value: string
}

export const formatInputNumber = (input: string): FormatInputNumberResult => {
  const numberedInput = Number(input);
  if (Number.isNaN(numberedInput)) {
    return {
      code: 1,
      value: '',
    };
  }
  const arr = String(input).split('.');
  const decimal = arr[0];
  const fraction = arr[1];

  if (fraction && fraction.length > 8) {
    return {
      code: 0,
      value: `${decimal}.${fraction.slice(0, 8)}`,
    };
  }
  return {
    code: 0,
    value: input,
  };
};

interface ValidateResult {
  code: number
  message: string
}

export const validateTransferAmount = (payload: {
  tansferAmount: string
  balance: BI
  transferToLock: Script | undefined
  isTransferAll: boolean
}): ValidateResult => {
  if (isNaN(Number(payload.tansferAmount))) {
    return {
      code: 1,
      message: 'Transfer amount must be a valid number.',
    };
  }
  if (Number(payload.tansferAmount) < MIN_TRANSFER_AMOUNT) {
    return {
      code: 2,
      message: `Transfer amount must be no less than ${MIN_TRANSFER_AMOUNT}.`,
    };
  }
  if (
    !payload.isTransferAll &&
    payload.balance
      .sub(DEFAULT_TX_FEE)
      .sub(floatStringToShannon(payload.tansferAmount))
      .sub(BI.from(MIN_TRANSFER_AMOUNT).mul(10 ** 8))
      .lt(0)
  ) {
    return {
      code: 3,
      message: `Balance is not enough (need to pay ${MIN_TRANSFER_AMOUNT} shannons transaction fee and ${MIN_TRANSFER_AMOUNT} CKBs for change cell).`,
    };
  }
  if (!payload.transferToLock?.args) {
    return {
      code: 5,
      message: 'Transfer to address is not valid.',
    };
  }
  return {
    code: 0,
    message: '',
  };
};

export const floatStringToShannon = (input: string): BI => {
  const arr = String(input).split('.');
  const decimal = arr[0];
  const decimalBI = BI.from(decimal).mul(10 ** 8);
  const fraction = arr[1];
  if (!fraction) return decimalBI;
  const fractionBI = BI.from(fraction.padEnd(8, '0'));
  return decimalBI.add(fractionBI);
};
