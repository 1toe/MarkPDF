import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Portal,
  Progress,
  Spinner,
  Text,
} from "@chakra-ui/react";

interface UploadProgressModalProps {
  isOpen: boolean;
}

export function UploadProgressModal({ isOpen }: UploadProgressModalProps) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setProgress(10);
      return;
    }
    const interval = setInterval(() => {
      // Functional setState to avoid stale closure (rerender-functional-setstate)
      setProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset={0}
        zIndex={50}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="blackAlpha.600"
        backdropFilter="blur(4px)"
        role="dialog"
        aria-modal="true"
        aria-label="Procesando PDF"
      >
        <Box
          w="full"
          maxW="md"
          borderRadius="xl"
          bg="white"
          p={6}
          shadow="xl"
          borderWidth="1px"
          borderColor="gray.200"
          textAlign="center"
        >
          <Flex justify="center" mb={4}>
            <Flex
              h={14}
              w={14}
              align="center"
              justify="center"
              borderRadius="full"
              bg="orange.100"
              color="orange.600"
            >
              <Spinner size="lg" color="orange.600" />
            </Flex>
          </Flex>

          <Text as="h3" fontSize="lg" fontWeight="bold" color="gray.900" mb={1}>
            Procesando e Inspeccionando PDF
          </Text>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Analizando estructura, extrayendo texto y detectando tablas. Por favor espere...
          </Text>

          <Box>
            <Flex justify="space-between" mb={1.5}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.700">Progreso</Text>
              <Text fontSize="xs" fontWeight="semibold" color="gray.700">{progress}%</Text>
            </Flex>
            <Progress.Root value={progress} colorPalette="orange" size="sm" borderRadius="full">
              <Progress.Track borderRadius="full">
                <Progress.Range borderRadius="full" />
              </Progress.Track>
            </Progress.Root>
          </Box>
        </Box>
      </Box>
    </Portal>
  );
}
