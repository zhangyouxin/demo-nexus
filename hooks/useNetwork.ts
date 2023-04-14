import react, { useEffect } from "react";
import {
  DEFAULT_NETWORKS,
  NetworkConfig,
  NetworkInfo,
} from "../common/network";
import { useLocalStorage } from "usehooks-ts";

export const useNetwork = () => {
  const [networkList, setNetworkList] = useLocalStorage<NetworkConfig[] | undefined>(
    "nexus-network-list",
    undefined
  );

  useEffect(() => {
    if (!networkList) {
      setNetworkList(DEFAULT_NETWORKS);
    }
  });
  const network =
    (!!networkList && networkList.find((network) => !!network.enable)) ||
    DEFAULT_NETWORKS[0];

  const setNetwork = (networkId: string) => {
    const newNetworkList = networkList!.map((network) => {
      if (network.id === networkId) {
        network.enable = true;
      } else {
        network.enable = false;
      }
      return network;
    });
    setNetworkList(newNetworkList);
  };

  return { network, networkList, setNetwork, setNetworkList };
};
