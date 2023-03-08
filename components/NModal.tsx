import * as React from "react";
import {
  Text,
  useToast,
  Link,
  IconButton,
  Button,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  Modal,
} from "@chakra-ui/react";
import { QuestionOutlineIcon } from "@chakra-ui/icons";

export function NModal({title, children}) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
    <Button onClick={onOpen}>{title}</Button>

    <Modal onClose={onClose} isOpen={isOpen} isCentered size='4xl'>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {children}
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </>
  );
}
