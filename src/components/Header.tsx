import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { LuFileSearch, LuMenu } from "react-icons/lu";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  return (
    <Box as="header" borderBottomWidth="1px" borderColor="gray.200" bg="white" px={{ base: 4, md: 8 }} py={4}>
      <Flex mx="auto" maxW="7xl" align="center" justify="space-between">
        <Flex align="center" gap={3}>
          {/* Mobile menu toggle: only visible below md */}
          <IconButton
            aria-label="Abrir menu de navegacion"
            variant="outline"
            size="sm"
            onClick={onToggleSidebar}
            display={{ base: "flex", md: "none" }}
          >
            <LuMenu />
          </IconButton>

          {/* Brand mark: amber square with search icon */}
          <Flex
            h={10}
            w={10}
            align="center"
            justify="center"
            borderRadius="md"
            bg="orange.500"
            color="white"
            shrink={0}
          >
            <LuFileSearch size={20} />
          </Flex>

          <Box>
            <Text as="h1" fontSize="lg" fontWeight="bold" letterSpacing="tight" color="gray.900" lineHeight="tight">
              Inspector de PDF
            </Text>
            <Text fontSize="sm" color="gray.600" lineHeight="tight">
              Clasificacion rapida y extraccion de texto sin OCR
            </Text>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
