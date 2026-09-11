import { useEffect, useState } from "react";
import { HistoryItem, getHistoryItems } from "../lib/db";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Portal,
  Text,
} from "@chakra-ui/react";
import {
  LuClock,
  LuFileText,
  LuHistory,
  LuPlus,
  LuX,
} from "react-icons/lu";

interface SidebarProps {
  currentId: string | null;
  onSelect: (item: HistoryItem) => void;
  onNew: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ currentId, onSelect, onNew, isOpen, setIsOpen }: SidebarProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  const loadHistory = async () => {
    try {
      const data = await getHistoryItems();
      setItems(data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  useEffect(() => {
    loadHistory();
    const handleStorage = () => loadHistory();
    window.addEventListener("pdf-inspected", handleStorage);
    return () => window.removeEventListener("pdf-inspected", handleStorage);
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <Portal>
          <Box
            position="fixed"
            inset={0}
            zIndex={45}
            bg="blackAlpha.400"
            display={{ md: "none" }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        </Portal>
      )}

      {/* Sidebar drawer */}
      <Box
        as="aside"
        position="fixed"
        insetY={0}
        left={0}
        zIndex={50}
        w="320px"
        bg="white"
        borderRightWidth="1px"
        borderColor="gray.200"
        display="flex"
        flexDirection="column"
        transform={{ base: isOpen ? "translateX(0)" : "translateX(-100%)", md: "translateX(0)" }}
        transition="transform 200ms ease-in-out"
      >
        {/* Header row */}
        <Flex
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderColor="gray.200"
          p={4}
        >
          <Flex align="center" gap={2}>
            <LuHistory size={18} color="var(--chakra-colors-orange-600)" />
            <Text as="h2" fontWeight="semibold" color="gray.900" fontSize="base">
              Navegacion e Historial
            </Text>
          </Flex>
          <IconButton
            aria-label="Cerrar sidebar"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            display={{ md: "none" }}
          >
            <LuX />
          </IconButton>
        </Flex>

        {/* New PDF button */}
        <Box p={4} borderBottomWidth="1px" borderColor="gray.200">
          <Button
            w="full"
            colorPalette="orange"
            onClick={() => {
              onNew();
              setIsOpen(false);
            }}
          >
            <LuPlus />
            Inspeccionar Nuevo PDF
          </Button>
        </Box>

        {/* History list */}
        <Box flex="1" overflowY="auto" p={4}>
          <Text fontSize="xs" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
            Documentos Guardados ({items.length})
          </Text>

          {items.length === 0 ? (
            /* Empty state (antislop R-27) */
            <Flex direction="column" align="center" justify="center" py={8} gap={2} textAlign="center">
              <LuFileText size={32} color="var(--chakra-colors-gray-300)" />
              <Text fontSize="sm" color="gray.500">
                No hay documentos inspeccionados en el historial todavia.
              </Text>
            </Flex>
          ) : (
            <Flex direction="column" gap={2}>
              {items.map((item) => {
                const isSelected = item.id === currentId;
                const dateStr = new Date(item.timestamp).toLocaleDateString();
                return (
                  <Box
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    cursor="pointer"
                    borderWidth="1px"
                    borderRadius="md"
                    p={3}
                    borderColor={isSelected ? "orange.600" : "gray.200"}
                    bg={isSelected ? "orange.50" : "white"}
                    _hover={{ borderColor: "orange.400", bg: isSelected ? "orange.50" : "gray.50" }}
                    _focusVisible={{ outline: "2px solid", outlineColor: "orange.500", outlineOffset: "2px" }}
                    onClick={() => { onSelect(item); setIsOpen(false); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(item);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <Flex align="flex-start" gap={3} minW={0}>
                      <Box
                        borderRadius="md"
                        bg="orange.100"
                        p={2}
                        color="orange.700"
                        flexShrink={0}
                      >
                        <LuFileText size={16} />
                      </Box>
                      <Box minW={0}>
                        <Text fontWeight="medium" color="gray.900" fontSize="sm" truncate maxW="200px">
                          {item.filename || item.result?.title || "Documento"}
                        </Text>
                        <Flex align="center" gap={1} mt={1}>
                          <LuClock size={12} color="var(--chakra-colors-gray-400)" />
                          <Text fontSize="xs" color="gray.500">{dateStr}</Text>
                        </Flex>
                        <Flex align="center" gap={2} mt={1.5}>
                          <Text
                            as="span"
                            borderRadius="sm"
                            bg="gray.100"
                            px={1.5}
                            py={0.5}
                            fontSize="xs"
                            fontWeight="medium"
                            color="gray.700"
                          >
                            {item.result?.pdfType}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {item.result?.pageCount} pag.
                          </Text>
                        </Flex>
                      </Box>
                    </Flex>
                  </Box>
                );
              })}
            </Flex>
          )}
        </Box>
      </Box>
    </>
  );
}
