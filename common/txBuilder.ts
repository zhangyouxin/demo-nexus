import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { BI, Indexer, helpers, type Cell, type WitnessArgs, type Script } from '@ckb-lumos/lumos';
import { MIN_TRANSFER_AMOUNT, DEFAULT_TX_FEE } from './const';
import { type NetworkInfo } from './network';

export function buildTranferTx(payload: {
  transferAmountBI: BI
  network: NetworkInfo
  transferToLock: Script
  collectedCells: Cell[]
  changeLock: Script
  isTransferAll?: boolean
}) {
  const preparedCells: Cell[] = [];
  let prepareAmount = BI.from(0);
  for (let i = 0; i < payload.collectedCells.length; i++) {
    const cellCkbAmount = BI.from(payload.collectedCells[i].cellOutput.capacity);
    preparedCells.push(payload.collectedCells[i]);
    prepareAmount = prepareAmount.add(cellCkbAmount);
    if (
      prepareAmount
        .sub(1000)
        .sub(MIN_TRANSFER_AMOUNT * 10 ** 8)
        .gte(payload.transferAmountBI)
    ) {
      break;
    }
  }
  const indexer = new Indexer(payload.network.rpcUrl);
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  txSkeleton = txSkeleton.update('inputs', (inputs) => {
    return inputs.concat(...preparedCells);
  });

  const outputCells: Cell[] = [];
  outputCells[0] = {
    cellOutput: {
      capacity: payload.transferAmountBI.toHexString(),
      lock: payload.transferToLock,
    },
    data: '0x',
  };
  if (payload.isTransferAll) {
    // transfer all
    const originalAmount = BI.from(preparedCells[0].cellOutput.capacity);
    if (originalAmount.sub(DEFAULT_TX_FEE).lt(BI.from(MIN_TRANSFER_AMOUNT).mul(10 ** 8))) {
      throw new Error('transfer amount is too small');
    }
    outputCells[0].cellOutput.capacity = BI.from(outputCells[0].cellOutput.capacity).sub(DEFAULT_TX_FEE).toHexString();
  } else {
    // need change
    outputCells[1] = {
      cellOutput: {
        // change amount = prepareAmount - transferAmount - DEFAULT_TX_FEE shannons for tx fee
        capacity: prepareAmount.sub(payload.transferAmountBI).sub(DEFAULT_TX_FEE).toHexString(),
        lock: payload.changeLock,
      },
      data: '0x',
    };
  }
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.concat(...outputCells);
  });

  const SECP256K1_BLAKE160 = payload.network.config.SCRIPTS.SECP256K1_BLAKE160!;
  txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => {
    return cellDeps.concat({
      outPoint: {
        txHash: SECP256K1_BLAKE160.TX_HASH,
        index: SECP256K1_BLAKE160.INDEX,
      },
      depType: SECP256K1_BLAKE160.DEP_TYPE,
    });
  });
  for (let i = 0; i < preparedCells.length; i++) {
    txSkeleton = txSkeleton.update('witnesses', (witnesses) => witnesses.push('0x'));
  }
  const witnessArgs: WitnessArgs = {
    lock: bytes.hexify(new Uint8Array(65)),
  };
  const secp256k1Witness = bytes.hexify(blockchain.WitnessArgs.pack(witnessArgs));
  for (let i = 0; i < preparedCells.length; i++) {
    txSkeleton = txSkeleton.update('witnesses', (witnesses) => witnesses.set(i, secp256k1Witness));
  }
  console.log('txSkeleton', helpers.transactionSkeletonToObject(txSkeleton));
  const tx = helpers.createTransactionFromSkeleton(txSkeleton);
  return { tx, txSkeleton };
}
