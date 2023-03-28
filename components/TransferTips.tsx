import * as React from "react";
import { Text, Link } from "@chakra-ui/react";
import { BaseIconButton } from "./BaseIconButton";

export function TransferTips() {
  return (
    <BaseIconButton
      description={
        <Text>
          The minimum transfer amount is 2 to the power of 64 shannons, that is
          about 184.5 billion CKBs. <br />
          The minimum transfer amount is 61 CKBs. <br />
          That is because the CKB blockchain uses Cell model, you need CKB
          tokens to store token info in cells, minimum cell costs 61 CKBs.{" "}
          <br />
          <Link
            href="https://docs.nervos.org/docs/basics/concepts/cryptowallet/#minimum-requirements-of-a-ckb-transfer"
            textDecor="underline"
          >
            READ MORE
          </Link>
        </Text>
      }
    />
  );
}
