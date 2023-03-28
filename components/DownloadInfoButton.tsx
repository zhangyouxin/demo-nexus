import * as React from "react";
import { Text, Link } from "@chakra-ui/react";
import { BaseIconButton } from "./BaseIconButton";

export function DownloadInfoButton() {
  return (
    <BaseIconButton
      description={
        <Text>
          You can download Nexus-Wallet Chrome Extension
          <Link
            href="https://github.com/zhangyouxin/demo-nexus/releases/tag/0.1.1"
            textDecor="underline"
            ml={2}
          >
            HERE
          </Link>{" "}
        </Text>
      }
    />
  );
}
