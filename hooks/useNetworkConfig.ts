import { useState, useEffect } from 'react';
import { type config, type Script, utils } from '@ckb-lumos/lumos';
import { type NetworkInfo } from '../common/network';
import { type RPC as RpcType } from '@ckb-lumos/rpc/lib/types/rpc';
import axios from 'axios';
import { useNetwork } from './useNetwork';

export const useNetworkConfig = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NetworkInfo>();
  const [error, setError] = useState(null);
  const { network } = useNetwork();
  console.log('network', network);
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const secp256k1Config = await loadSecp256k1ScriptDep({
          nodeUrl: network.rpcUrl,
        });
        setData({
          ...network,
          config: {
            PREFIX: 'ckt',
            SCRIPTS: {
              SECP256K1_BLAKE160: secp256k1Config,
            },
          },
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, [network]);

  return { loading, data, error };
};

async function loadSecp256k1ScriptDep(payload: { nodeUrl: string }): Promise<config.ScriptConfig> {
  const res = await axios.post(
    payload.nodeUrl,
    {
      id: 1,
      jsonrpc: '2.0',
      method: 'get_block_by_number',
      params: ['0x0'],
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
  const genesisBlock = res.data.result satisfies RpcType.Block;
  if (!genesisBlock) throw new Error("can't load genesis block");
  const secp256k1DepTxHash = genesisBlock.transactions[1].hash;
  const rawTypeScript = genesisBlock.transactions[0].outputs[1].type;
  const typeScript: Script = {
    codeHash: rawTypeScript.code_hash,
    hashType: rawTypeScript.hash_type,
    args: rawTypeScript.args,
  };
  const secp256k1TypeHash = utils.computeScriptHash(typeScript);

  return {
    HASH_TYPE: 'type',
    CODE_HASH: secp256k1TypeHash,
    INDEX: '0x0',
    TX_HASH: secp256k1DepTxHash,
    DEP_TYPE: 'depGroup',
  };
}
