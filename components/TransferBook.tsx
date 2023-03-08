import * as React from "react";
import {
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tooltip,
  Text,
  Link,
  Button,
  Box,
} from "@chakra-ui/react";
import {
  formatDisplayAddress,
  formatDisplayCapacity,
  formatDisplayHash,
} from "../common/utils";
import { Pagination } from "./Pagination";
import { DEFAULT_PAGE_SIZE } from "../common/const";
import { useLocalStorage } from "react-use";
import { TransferBookItem } from "../common/types";

export function TransferBook() {
  const [items = [], setTransferBookItems, removeTransferBookItems] =
    useLocalStorage<TransferBookItem[]>("nexus-transfer-book", []);
  const [pageIndex, setPageIndex] = React.useState(0);
  const currentPageItems = items.slice(pageIndex * 10, (pageIndex + 1) * 10);

  return (
    <TableContainer>
      <Table variant="striped" colorScheme="teal">
        <Thead>
          <Tr>
            <Th>Transfer To</Th>
            <Th>Amount</Th>
            <Th>Description</Th>
            <Th>Time</Th>
            <Th>Explorer</Th>
          </Tr>
        </Thead>
        <Tbody>
          {currentPageItems.map((item, index) => (
            <Tr key={item.to + index}>
              <Td>
                <Tooltip label={item.to}>
                  {formatDisplayAddress(item.to)}
                </Tooltip>
              </Td>
              <Td>{item.amount} CKB</Td>
              <Td >
                <Tooltip label={item.description}>
                  <Text textOverflow="ellipsis" overflow="hidden" maxWidth="200px"> {item.description || "-"}</Text>
                </Tooltip>
              </Td>
              <Td>
                    {item.time}
              </Td>
              <Td>
                <Link
                  href={`https://pudge.explorer.nervos.org/transaction/${item.txHash}`}
                >
                  <Text fontStyle="initial" fontWeight={500}>
                    Explorer
                  </Text>
                </Link>{" "}
              </Td>
            </Tr>
          ))}
          {currentPageItems.length <= DEFAULT_PAGE_SIZE &&
            new Array(DEFAULT_PAGE_SIZE - currentPageItems.length)
              .fill(null)
              .map((_, index) => (
                <Tr key={index}>
                  <Td>{"-"}</Td>
                  <Td>{"-"}</Td>
                  <Td>{"-"}</Td>
                  <Td>{"-"}</Td>
                  <Td>{"-"}</Td>
                </Tr>
              ))}
        </Tbody>
      </Table>
      <Box display="flex" gap={4} marginTop={4}>
        <Pagination
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          totalCount={items.length}
        />
        <Button onClick={removeTransferBookItems} colorScheme="red">
          {" "}
          Reset Transfer Book{" "}
        </Button>
      </Box>
    </TableContainer>
  );
}
