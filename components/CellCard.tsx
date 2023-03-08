import {
  Box,
  Badge,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Accordion,
  Text,
} from "@chakra-ui/react";
import { BI } from "@ckb-lumos/lumos";
import { NCell } from "../common/types";

export function CellCard(prop: NCell) {
  const property = {
    lock: prop.cellOutput.lock,
    capacity: prop.cellOutput.capacity,
    args: prop.cellOutput.lock.args,
    type: prop.cellOutput.type,
    address: prop.address,
  };

  return (
    <Box
      maxW="lg"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      margin="1rem"
    >
      <Box p="6">
        <Box display="flex" alignItems="baseline">
          <Badge borderRadius="full" px="2" colorScheme="teal">
            Full Ownership
          </Badge>
        </Box>

        <Box
          mt="1"
          fontWeight="semibold"
          as="h4"
          lineHeight="tight"
          noOfLines={1}
        >
          {(
            BI.from(property.capacity)
              .div(10 ** 6)
              .toNumber() / 100
          ).toFixed(2)}
        </Box>

        <Box
          mt="1"
          color="gray.500"
          fontWeight="semibold"
          letterSpacing="wide"
          fontSize="xs"
        >
          ADDRESS:{property.address}
        </Box>
        <Box
          mt="1"
          color="gray.500"
          fontWeight="semibold"
          letterSpacing="wide"
          fontSize="xs"
        >
          LOCK_ARGS:{property.args}
        </Box>
        {property.type && (
          <Accordion allowToggle marginTop={4}>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box as="span" flex="1" textAlign="left">
                    Type Script
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel>
                <Box
                  mt="1"
                  color="gray.500"
                  fontWeight="semibold"
                  letterSpacing="wide"
                  fontSize="xs"
                  display="flex"
                >
                  <Text>CODE HASH:</Text>{" "}
                  <Text width="250px">{property.type.codeHash}</Text>
                </Box>
                <Box
                  mt="1"
                  color="gray.500"
                  fontWeight="semibold"
                  letterSpacing="wide"
                  fontSize="xs"
                  display="flex"
                >
                  <Text>HASH TYPE:</Text>{" "}
                  <Text width="250px">{property.type.hashType}</Text>
                </Box>
                <Box
                  mt="1"
                  color="gray.500"
                  fontWeight="semibold"
                  letterSpacing="wide"
                  fontSize="xs"
                  display="flex"
                >
                  <Text>ARGS:</Text>{" "}
                  <Text width="250px">{property.type.args}</Text>
                </Box>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}
      </Box>
    </Box>
  );
}
