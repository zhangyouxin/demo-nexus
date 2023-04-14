import * as React from 'react';
import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Tooltip,
  useToast,
  Box,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { type NCell, type NScript } from '../common/types';
import { BI } from '@ckb-lumos/lumos';
import { formatDisplayAddress, formatDisplayCapacity } from '../common/utils';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Pagination } from './Pagination';
import { DEFAULT_PAGE_SIZE } from '../common/const';

interface AddressBookProp {
  offChainLockInfos: NScript[]
  onChainLockInfos: NScript[]
  cells: NCell[]
}
interface TableItemProp {
  address: string
  balance: string
}
export function AddressBook(prop: AddressBookProp) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const { offChainLockInfos, onChainLockInfos, cells } = prop;
  const tableItems = [...offChainLockInfos, ...onChainLockInfos].map(
    (lockInfo: NScript): TableItemProp => {
      const address = lockInfo.address;
      const addressCells = cells.filter((cell) => cell.address === address);
      const addressBalance = addressCells.reduce((acc, cell) => {
        return acc.add(cell.cellOutput.capacity);
      }, BI.from(0));
      return {
        address,
        balance: formatDisplayCapacity(addressBalance),
      };
    },
  );
  const toast = useToast();
  function handleAddressClick(): void {
    toast({
      title: 'Copied.',
      status: 'success',
      duration: 1000,
    });
  }
  const currentPageItems = tableItems.slice(
    pageIndex * DEFAULT_PAGE_SIZE,
    (pageIndex + 1) * DEFAULT_PAGE_SIZE,
  );

  return (
    <TableContainer>
      <Table variant="striped" colorScheme="teal">
        <Thead>
          <Tr>
            <Th>Address</Th>
            <Th>Balance</Th>
          </Tr>
        </Thead>
        <Tbody>
          {currentPageItems.map((item) => (
            <Tr key={item.address}>
              <Td>
                <Tooltip label={item.address}>
                  {formatDisplayAddress(item.address)}
                </Tooltip>
                <CopyToClipboard
                  text={item.address}
                  onCopy={() => {
                    handleAddressClick();
                  }}
                >
                  <CopyIcon cursor="pointer" marginLeft={2} />
                </CopyToClipboard>
              </Td>
              <Td>{item.balance} CKB</Td>
            </Tr>
          ))}
          {currentPageItems.length <= DEFAULT_PAGE_SIZE &&
            new Array(DEFAULT_PAGE_SIZE - currentPageItems.length)
              .fill(null)
              .map((_, index) => (
                <Tr key={index}>
                  <Td>{'-'}</Td>
                  <Td>{'-'}</Td>
                </Tr>
              ))}
        </Tbody>
      </Table>
      <Box marginTop={4}>
        <Pagination
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          totalCount={tableItems.length}
        />
      </Box>
    </TableContainer>
  );
}
