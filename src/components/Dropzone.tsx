import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { LuFileText, LuUpload } from "react-icons/lu";

interface DropzoneProps {
  onInspect: (file?: File, preset?: string) => void;
  isLoading: boolean;
}

export function Dropzone({ onInspect, isLoading }: DropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      onInspect(file);
    } else {
      alert("Por favor, sube un archivo PDF valido.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onInspect(file);
  };

  return (
    <Box>
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de PDF: haz clic o arrastra un archivo"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        cursor="pointer"
        borderRadius="md"
        border="2px dashed"
        borderColor={dragOver ? "orange.500" : "gray.200"}
        bg={dragOver ? "orange.50" : "white"}
        p={12}
        textAlign="center"
        transition="border-color 150ms, background 150ms"
        _focusVisible={{ outline: "2px solid", outlineColor: "orange.500", outlineOffset: "2px" }}
        _hover={{ borderColor: "orange.400", bg: "gray.50" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
          tabIndex={-1}
        />

        <Flex direction="column" align="center" maxW="md" mx="auto">
          <Flex
            mb={4}
            h={16}
            w={16}
            align="center"
            justify="center"
            borderRadius="md"
            bg="orange.100"
            color="orange.700"
          >
            {isLoading
              ? <Spinner size="lg" color="orange.600" />
              : <LuUpload size={32} />
            }
          </Flex>

          <Text as="h3" fontSize="lg" fontWeight="bold" color="gray.900">
            {isLoading ? "Inspeccionando PDF..." : "Arrastra tu archivo PDF aqui o explora"}
          </Text>
          <Text mt={2} fontSize="base" color="gray.600">
            Soporta PDFs basados en texto, escaneados, mixtos o con imagenes (hasta 25MB)
          </Text>

          <Button
            mt={6}
            colorPalette="gray"
            variant="solid"
            bg="gray.900"
            color="white"
            _hover={{ bg: "gray.700" }}
            disabled={isLoading}
            onClick={(e) => e.stopPropagation()}
          >
            <LuFileText />
            Seleccionar Archivo PDF
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
