import { useEffect } from 'react';
import { DEFAULT_NETWORKS, type NetworkConfig } from '../common/network';
import { useLocalStorage } from 'usehooks-ts';

export const useNetwork = () => {
  const [networkList, setNetworkList] = useLocalStorage<NetworkConfig[] | undefined>('nexus-network-list', undefined);

  useEffect(() => {
    if (!networkList) {
      setNetworkList(DEFAULT_NETWORKS);
    }
  });
  const network = (!!networkList && networkList.find((item) => !!item.enable)) || DEFAULT_NETWORKS[0];

  const setNetwork = (networkId: string) => {
    const newNetworkList = networkList!.map((item) => {
      if (item.id === networkId) {
        item.enable = true;
      } else {
        item.enable = false;
      }
      return item;
    });
    setNetworkList(newNetworkList);
  };

  return { network, networkList, setNetwork, setNetworkList };
};
