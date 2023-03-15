import * as React from "react";
import { Text, useToast, Link, IconButton } from "@chakra-ui/react";
import { QuestionOutlineIcon } from "@chakra-ui/icons";

export function DownloadInfoButton() {
  const toast = useToast();
  return (
    <IconButton
      marginLeft={2}
      borderRadius={40}
      colorScheme="gray"
      aria-label="Search database"
      icon={<QuestionOutlineIcon />}
      onClick={() => {
        toast({
          title: "Help",
          description: (
            <Text>
              You can download Nexus-Wallet Chrome Extension
              <Link href="https://github.com/zhangyouxin/demo-nexus/releases/tag/0.1.1">
                <Text fontStyle="initial" fontWeight={500}>
                  HERE
                </Text>
              </Link>{" "}
            </Text>
          ),
          status: "info",
          duration: 3_000,
          isClosable: true,
        });
      }}
    />
  );
}
