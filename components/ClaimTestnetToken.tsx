import * as React from "react";
import { Text, Link } from "@chakra-ui/react";
import { BaseIconButton } from "./BaseIconButton";

export function ClaimTestnetToken() {
  return (
    <BaseIconButton
      description={
        <Text>
          You can open the Address Book below and copy some addresss, then claim
          testnet token
          <Link href="https://faucet.nervos.org/" ml={2} textDecor="underline">
            HERE
          </Link>
        </Text>
      }
    />
  );
}
