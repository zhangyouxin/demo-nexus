import * as React from 'react';
import { useToast, IconButton } from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons';

export function BaseIconButton(props: {
  description: React.ReactNode
  title?: string
}) {
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
          title: props.title || 'Tips',
          description: props.description,
          status: 'info',
          duration: 5_000,
          isClosable: true,
        });
      }}
    />
  );
}
