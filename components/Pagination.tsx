import * as React from "react";
import { Text, IconButton, Box } from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { DEFAULT_PAGE_SIZE } from "../common/const";

export function Pagination({
  pageIndex,
  setPageIndex,
  totalCount,
  pageSize = DEFAULT_PAGE_SIZE,
}) {
  const maxPageIndex = Math.ceil(totalCount / pageSize) - 1;
  return (
    <Box>
      <IconButton
        aria-label={"previous"}
        onClick={() => setPageIndex(pageIndex > 0 ? pageIndex - 1 : 0)}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Text display="inline-block" marginX={4}>
        {pageIndex + 1}{" "}
      </Text>
      <IconButton
        aria-label={"next"}
        onClick={() =>
          setPageIndex(pageIndex < maxPageIndex ? pageIndex + 1 : maxPageIndex)
        }
      >
        <ChevronRightIcon />
      </IconButton>
      <Text display="inline-block" marginX={4} fontWeight={600}>
        Total: {totalCount}{" "}
      </Text>
    </Box>
  );
}
