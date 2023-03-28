import * as React from "react";
import { Text, useToast, Link, IconButton, Box } from "@chakra-ui/react";
import { QuestionOutlineIcon } from "@chakra-ui/icons";

export function ClaimTestnetToken() {
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
          title: "Testnet Tips",
          description: (
            <Text>
              You can open the Address Book below and copy some addresss, then
              claim testnet token
              <Link href="https://faucet.nervos.org/" ml={2}>
                HERE
              </Link>
            </Text>
          ),
          status: "info",
          duration: 5_000,
          isClosable: true,
        });
      }}
    />
  );
}
