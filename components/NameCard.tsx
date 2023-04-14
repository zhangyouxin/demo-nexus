import * as React from 'react';
import { Box } from '@chakra-ui/react';

export function NameCard(props: { nickName: string }) {
  return (
    <Box bg={'gray.100'} paddingX={2} margin={2} borderRadius={4} textAlign={'center'} fontSize={24}>
      Hi, {props.nickName}
    </Box>
  );
}
