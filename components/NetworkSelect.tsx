import * as React from "react";
import { Box, Radio, Stack, RadioGroup } from "@chakra-ui/react";
import { isEmpty } from "lodash";
import { useNetwork } from "../hooks/useNetwork";

export function NetworkSelect() {
  const { network, networkList, setNetwork } = useNetwork();

  const handleNetworkChange = (selectedNetwork) => {
    setNetwork(selectedNetwork);
  };
  return (
    <Box>
      {isEmpty(networkList) && <div>No Network Configs.</div>}
      {!isEmpty(networkList) && (
        <RadioGroup defaultValue={network.id} onChange={handleNetworkChange}>
          <Stack>
            {networkList!.map((network) => {
              return (
                <Radio key={network.id} value={network.id}>
                  {network.displayName}
                </Radio>
              );
            })}
          </Stack>
        </RadioGroup>
      )}
    </Box>
  );
}
