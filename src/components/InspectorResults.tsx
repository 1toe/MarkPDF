import { useState } from "react";
import { PdfResult } from "../types";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  SimpleGrid,
  Spinner,
  Table,
  Tabs,
  Text,
} from "@chakra-ui/react";
import {
  LuTriangleAlert,
  LuCircleCheck,
  LuClock,
  LuCopy,
  LuCpu,
  LuDownload,
  LuFileText,
  LuGrid2X2,
  LuLayers,
  LuRotateCcw,
} from "react-icons/lu";

interface InspectorResultsProps {
  result: PdfResult & { filename?: string; pdfBase64?: string };
  onReset: () => void;
}

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

// Module-level pure function: not re-created on every render (rerender-no-inline-components)
function extractMarkdownTables(markdown: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].includes("---")) {
      const parseRow = (rowStr: string) =>
        rowStr
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell, idx, arr) => !(idx === 0 && cell === "") && !(idx === arr.length - 1 && cell === ""));

      const headers = parseRow(line);
      const rows: string[][] = [];
      i += 2;

      while (i < lines.length) {
        const rowLine = lines[i].trim();
        if (!rowLine.includes("|") || rowLine === "") break;
        rows.push(parseRow(rowLine));
        i++;
      }

      if (headers.length > 0) tables.push({ headers, rows });
    } else {
      i++;
    }
  }

  return tables;
}

function getTypeColor(type: string): string {
  switch (type) {
    case "TextBased": return "green";
    case "Scanned":   return "orange";
    case "Mixed":     return "blue";
    default:          return "gray";
  }
}

function getTypeName(type: string): string {
  switch (type) {
    case "TextBased":  return "Basado en Texto";
    case "Scanned":    return "Escaneado";
    case "Mixed":      return "Mixto";
    case "ImageBased": return "Basado en Imagen";
    default:           return type;
  }
}

export function InspectorResults({ result, onReset }: InspectorResultsProps) {
  const [activeTab, setActiveTab] = useState<"markdown" | "metadata" | "tables">("markdown");
  const [tableDisplayMode, setTableDisplayMode] = useState<"native" | "raw">("native");
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Derived: no extra state needed (rerender-derived-state-no-effect)
  const tables = extractMarkdownTables(result.markdown || "");

  const handleCopyMarkdown = () => {
    if (!result.markdown) return;
    navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!result.markdown) return;
    const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${result.title || result.filename || "documento"}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    if (!result.pdfBase64) return;
    setIsDownloading(true);
    try {
      const binaryString = atob(result.pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", result.filename || "documento.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Flex direction="column" gap={6}>
      {/* Summary card */}
      <Card.Root borderWidth="1px" borderColor="gray.200">
        <Card.Body>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ md: "center" }}
            justify={{ md: "space-between" }}
            gap={4}
          >
            <Flex align="flex-start" gap={4}>
              <Flex
                h={14}
                w={14}
                flexShrink={0}
                align="center"
                justify="center"
                borderRadius="md"
                bg="orange.100"
                color="orange.700"
              >
                <LuFileText size={28} />
              </Flex>
              <Box>
                <Flex flexWrap="wrap" align="center" gap={3}>
                  <Text as="h2" fontSize="xl" fontWeight="bold" color="gray.900">
                    {result.title || result.filename}
                  </Text>
                  <Badge colorPalette={getTypeColor(result.pdfType)} variant="subtle">
                    {getTypeName(result.pdfType)}
                  </Badge>
                </Flex>
                <Text mt={1} fontSize="sm" color="gray.600">
                  {result.pageCount} paginas procesadas en {result.processingTimeMs}ms. Confianza: {(result.confidence * 100).toFixed(1)}%
                </Text>
              </Box>
            </Flex>

            <Flex flexWrap="wrap" align="center" gap={3}>
              <Button variant="outline" size="sm" onClick={onReset}>
                <LuRotateCcw />
                Inspeccionar Otro PDF
              </Button>
              {result.pdfBase64 && (
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} loading={isDownloading}>
                  <LuDownload />
                  Descargar PDF
                </Button>
              )}
              <Button colorPalette="orange" size="sm" onClick={handleDownloadMarkdown}>
                <LuDownload />
                Exportar Markdown
              </Button>
            </Flex>
          </Flex>

          {/* Key metrics */}
          <SimpleGrid columns={{ base: 2, sm: 4 }} gap={4} mt={6} pt={6} borderTopWidth="1px" borderColor="gray.100">
            <Flex align="center" gap={3}>
              <Box borderRadius="md" bg="gray.100" p={2} color="gray.700">
                <LuLayers size={20} />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">Complejidad</Text>
                <Text fontSize="sm" fontWeight="bold" color="gray.900">
                  {result.isComplexLayout ? "Tablas/Columnas" : "Flujo Unico"}
                </Text>
              </Box>
            </Flex>

            <Flex align="center" gap={3}>
              <Box borderRadius="md" bg="gray.100" p={2} color="gray.700">
                <LuClock size={20} />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">Velocidad</Text>
                <Text fontSize="sm" fontWeight="bold" color="gray.900">{result.processingTimeMs} ms</Text>
              </Box>
            </Flex>

            <Flex align="center" gap={3}>
              <Box borderRadius="md" bg="gray.100" p={2} color="gray.700">
                <LuGrid2X2 size={20} />
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">Tablas Detectadas</Text>
                <Text fontSize="sm" fontWeight="bold" color="gray.900">
                  {tables.length || result.pagesWithTables.length} tablas
                </Text>
              </Box>
            </Flex>

            <Flex align="center" gap={3}>
              <Box borderRadius="md" bg="gray.100" p={2} color="gray.700">
                {result.pagesNeedingOcr.length === 0
                  ? <LuCircleCheck size={20} color="var(--chakra-colors-green-600)" />
                  : <LuTriangleAlert size={20} color="var(--chakra-colors-orange-600)" />
                }
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">Ruta OCR</Text>
                <Text fontSize="sm" fontWeight="bold" color="gray.900">
                  {result.pagesNeedingOcr.length === 0
                    ? "Solo Extraccion Local"
                    : `${result.pagesNeedingOcr.length} pag. necesitan OCR`
                  }
                </Text>
              </Box>
            </Flex>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(e) => setActiveTab(e.value as typeof activeTab)}
        variant="line"
      >
        <Tabs.List borderBottomWidth="1px" borderColor="gray.200" overflowX="auto">
          <Tabs.Trigger value="markdown">
            <LuFileText size={16} />
            Salida Markdown
          </Tabs.Trigger>
          <Tabs.Trigger value="metadata">
            <LuCpu size={16} />
            Clasificacion y Metadatos
          </Tabs.Trigger>
          <Tabs.Trigger value="tables">
            <LuGrid2X2 size={16} />
            Tablas ({tables.length})
          </Tabs.Trigger>
        </Tabs.List>

        {/* Markdown tab */}
        <Tabs.Content value="markdown">
          <Card.Root borderWidth="1px" borderColor="gray.200" overflow="hidden">
            <Flex
              align="center"
              justify="space-between"
              borderBottomWidth="1px"
              borderColor="gray.200"
              bg="gray.50"
              px={6}
              py={3}
            >
              <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="wide" color="gray.600">
                Vista Previa de Markdown
              </Text>
              <Button variant="outline" size="sm" onClick={handleCopyMarkdown}>
                {copied ? <LuCircleCheck color="var(--chakra-colors-green-600)" /> : <LuCopy />}
                {copied ? "Copiado!" : "Copiar Markdown"}
              </Button>
            </Flex>
            <Box
              as="pre"
              maxH="600px"
              overflowY="auto"
              p={6}
              fontFamily="mono"
              fontSize="sm"
              lineHeight="relaxed"
              color="gray.800"
              whiteSpace="pre-wrap"
              bg="gray.50"
            >
              {result.markdown || "Sin contenido extraido."}
            </Box>
          </Card.Root>
        </Tabs.Content>

        {/* Metadata tab */}
        <Tabs.Content value="metadata">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
            <Card.Root borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <Text as="h3" fontWeight="bold" color="gray.900" fontSize="base" mb={4}>
                  Analisis de Clasificacion
                </Text>
                <Flex direction="column" gap={0}>
                  {[
                    ["Clasificacion PDF", getTypeName(result.pdfType)],
                    ["Confianza de Deteccion", `${(result.confidence * 100).toFixed(1)}%`],
                    ["Total de Paginas", `${result.pageCount} paginas`],
                    ["Tiempo de Procesamiento", `${result.processingTimeMs} ms`],
                    ["Problemas de Codificacion", result.hasEncodingIssues ? "Detectados" : "Ninguno"],
                  ].map(([label, value]) => (
                    <Flex
                      key={label}
                      justify="space-between"
                      borderBottomWidth="1px"
                      borderColor="gray.100"
                      py={2.5}
                      fontSize="sm"
                    >
                      <Text color="gray.600">{label}</Text>
                      <Text fontWeight="semibold" color="gray.900">{value}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Card.Body>
            </Card.Root>

            <Card.Root borderWidth="1px" borderColor="gray.200">
              <Card.Body>
                <Text as="h3" fontWeight="bold" color="gray.900" fontSize="base" mb={4}>
                  Diagnosticos de Ruta OCR
                </Text>
                <Flex
                  justify="space-between"
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                  py={2.5}
                  fontSize="sm"
                  mb={3}
                >
                  <Text color="gray.600">Paginas que necesitan OCR</Text>
                  <Text fontWeight="semibold" color="gray.900">
                    {result.pagesNeedingOcr.length === 0
                      ? "Ninguna"
                      : result.pagesNeedingOcr.join(", ")
                    }
                  </Text>
                </Flex>

                {result.ocrReasonsByPage.map((reason, idx) => (
                  <Box
                    key={idx}
                    borderRadius="md"
                    bg="orange.50"
                    borderWidth="1px"
                    borderColor="orange.200"
                    p={3}
                    fontSize="sm"
                    color="orange.900"
                    mb={2}
                  >
                    <Text as="span" fontWeight="bold">Pagina {reason.page}:</Text>{" "}
                    {reason.reasons.join(", ")}
                  </Box>
                ))}

                {result.pagesNeedingOcr.length === 0 && (
                  <Flex
                    borderRadius="md"
                    bg="green.50"
                    borderWidth="1px"
                    borderColor="green.200"
                    p={4}
                    fontSize="sm"
                    color="green.900"
                    align="center"
                    gap={3}
                  >
                    <Box as="span" flexShrink={0} display="flex">
                      <LuCircleCheck size={20} color="var(--chakra-colors-green-600)" />
                    </Box>
                    <Text>
                      Todas las paginas se extrajeron correctamente a nivel local sin costos de OCR externos.
                    </Text>
                  </Flex>
                )}
              </Card.Body>
            </Card.Root>
          </Grid>
        </Tabs.Content>

        {/* Tables tab */}
        <Tabs.Content value="tables">
          <Card.Root borderWidth="1px" borderColor="gray.200">
            <Card.Body>
              <Flex
                direction={{ base: "column", sm: "row" }}
                align={{ sm: "center" }}
                justify={{ sm: "space-between" }}
                gap={4}
                mb={4}
              >
                <Box>
                  <Text as="h3" fontWeight="bold" color="gray.900" fontSize="lg">
                    Tablas Estructuradas Extraidas
                  </Text>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Visualice y alterne entre la tabla React nativa y la vista cruda de Markdown.
                  </Text>
                </Box>

                <Flex align="center" gap={3}>
                  <Flex borderRadius="lg" bg="gray.100" p={1} borderWidth="1px" borderColor="gray.200">
                    <Button
                      size="xs"
                      variant={tableDisplayMode === "native" ? "solid" : "ghost"}
                      colorPalette={tableDisplayMode === "native" ? "gray" : undefined}
                      bg={tableDisplayMode === "native" ? "white" : "transparent"}
                      shadow={tableDisplayMode === "native" ? "sm" : undefined}
                      fontWeight={tableDisplayMode === "native" ? "semibold" : "medium"}
                      onClick={() => setTableDisplayMode("native")}
                    >
                      React Nativa
                    </Button>
                    <Button
                      size="xs"
                      variant={tableDisplayMode === "raw" ? "solid" : "ghost"}
                      colorPalette={tableDisplayMode === "raw" ? "gray" : undefined}
                      bg={tableDisplayMode === "raw" ? "white" : "transparent"}
                      shadow={tableDisplayMode === "raw" ? "sm" : undefined}
                      fontWeight={tableDisplayMode === "raw" ? "semibold" : "medium"}
                      onClick={() => setTableDisplayMode("raw")}
                    >
                      Markdown Crudo
                    </Button>
                  </Flex>
                  <Badge colorPalette="orange" variant="subtle">
                    {tables.length} {tables.length === 1 ? "tabla" : "tablas"}
                  </Badge>
                </Flex>
              </Flex>

              {/* Empty state (antislop R-27) */}
              {tables.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                  bg="gray.50"
                  p={12}
                  textAlign="center"
                  gap={3}
                >
                  <LuGrid2X2 size={48} color="var(--chakra-colors-gray-300)" />
                  <Text fontWeight="bold" color="gray.900">
                    No se detectaron tablas en este documento
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    El documento contiene texto continuo o sin formato tabular de cuadricula.
                  </Text>
                </Flex>
              ) : tableDisplayMode === "native" ? (
                <Flex direction="column" gap={8}>
                  {tables.map((table, idx) => (
                    <Box
                      key={idx}
                      overflow="hidden"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="gray.200"
                      bg="white"
                      shadow="sm"
                    >
                      <Flex
                        align="center"
                        justify="space-between"
                        bg="gray.50"
                        px={4}
                        py={2}
                        borderBottomWidth="1px"
                        borderColor="gray.200"
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        <Flex align="center" gap={2}>
                          <LuGrid2X2 size={16} color="var(--chakra-colors-orange-600)" />
                          <Text>Tabla Estructurada #{idx + 1}</Text>
                        </Flex>
                        <Text fontSize="xs" color="gray.500" fontWeight="normal">
                          {table.rows.length} filas, {table.headers.length} columnas
                        </Text>
                      </Flex>
                      <Box overflowX="auto">
                        <Table.Root size="sm" variant="line">
                          <Table.Header>
                            <Table.Row bg="gray.100">
                              {table.headers.map((header, hIdx) => (
                                <Table.ColumnHeader
                                  key={hIdx}
                                  px={4}
                                  py={3}
                                  fontWeight="bold"
                                  color="gray.900"
                                  fontSize="xs"
                                  textTransform="uppercase"
                                  letterSpacing="wider"
                                  whiteSpace="nowrap"
                                >
                                  {header || `Columna ${hIdx + 1}`}
                                </Table.ColumnHeader>
                              ))}
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {table.rows.map((row, rIdx) => (
                              <Table.Row key={rIdx} _hover={{ bg: "gray.50" }}>
                                {table.headers.map((_, cIdx) => (
                                  <Table.Cell
                                    key={cIdx}
                                    px={4}
                                    py={3}
                                    color="gray.800"
                                    fontSize="sm"
                                    whiteSpace="nowrap"
                                  >
                                    {row[cIdx] || "-"}
                                  </Table.Cell>
                                ))}
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    </Box>
                  ))}
                </Flex>
              ) : (
                <Flex direction="column" gap={4}>
                  <Box
                    borderRadius="md"
                    bg="gray.50"
                    borderWidth="1px"
                    borderColor="gray.200"
                    p={4}
                    fontSize="xs"
                    fontFamily="mono"
                    color="gray.600"
                  >
                    Vista de formato Markdown crudo para las tablas detectadas:
                  </Box>
                  {tables.map((table, idx) => {
                    const mdTableString = [
                      `| ${table.headers.join(" | ")} |`,
                      `| ${table.headers.map(() => "---").join(" | ")} |`,
                      ...table.rows.map((row) => `| ${table.headers.map((_, i) => row[i] || "").join(" | ")} |`),
                    ].join("\n");

                    return (
                      <Box
                        key={idx}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.700"
                        bg="gray.900"
                        color="gray.100"
                        p={4}
                        fontFamily="mono"
                        fontSize="sm"
                        overflowX="auto"
                      >
                        <Text fontSize="xs" color="gray.400" mb={2} fontWeight="semibold">
                          --- Tabla #{idx + 1} (Markdown Crudo) ---
                        </Text>
                        <Box as="pre" whiteSpace="pre-wrap">{mdTableString}</Box>
                      </Box>
                    );
                  })}
                </Flex>
              )}
            </Card.Body>
          </Card.Root>
        </Tabs.Content>
      </Tabs.Root>

      {/* Document Summary Panel */}
      <Card.Root borderWidth="1px" borderColor="gray.200" shadow="sm">
        <Card.Body>
          <Flex
            align="center"
            justify="space-between"
            borderBottomWidth="1px"
            borderColor="gray.100"
            pb={4}
            mb={4}
          >
            <Flex align="center" gap={3}>
              <Box borderRadius="lg" bg="orange.100" p={2} color="orange.800">
                <LuFileText size={20} />
              </Box>
              <Box>
                <Text as="h3" fontWeight="bold" color="gray.900" fontSize="base">
                  Resumen del Documento
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Metricas y clasificacion procesadas con Firecrawl pdf-inspector
                </Text>
              </Box>
            </Flex>
            <Badge colorPalette={getTypeColor(result.pdfType)} variant="subtle">
              {getTypeName(result.pdfType)}
            </Badge>
          </Flex>

          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
            <Box borderRadius="lg" bg="gray.50" borderWidth="1px" borderColor="gray.200" p={4}>
              <Text fontSize="xs" fontWeight="medium" color="gray.500">Tipo de Documento</Text>
              <Text fontSize="base" fontWeight="bold" color="gray.900" mt={1}>{getTypeName(result.pdfType)}</Text>
              <Text fontSize="xs" color="gray.600" mt={0.5}>
                {result.pdfType === "TextBased"
                  ? "Texto nativo estructurado"
                  : result.pdfType === "Scanned"
                  ? "Requiere motor OCR"
                  : "Contenido mixto"}
              </Text>
            </Box>

            <Box borderRadius="lg" bg="gray.50" borderWidth="1px" borderColor="gray.200" p={4}>
              <Text fontSize="xs" fontWeight="medium" color="gray.500">Total de Paginas</Text>
              <Text fontSize="base" fontWeight="bold" color="gray.900" mt={1}>
                {result.pageCount} {result.pageCount === 1 ? "pagina" : "paginas"}
              </Text>
              <Text fontSize="xs" color="gray.600" mt={0.5}>
                {tables.length} {tables.length === 1 ? "tabla detectada" : "tablas detectadas"}
              </Text>
            </Box>

            <Box borderRadius="lg" bg="gray.50" borderWidth="1px" borderColor="gray.200" p={4}>
              <Text fontSize="xs" fontWeight="medium" color="gray.500">Confianza de Extraccion</Text>
              <Text fontSize="base" fontWeight="bold" color="green.700" mt={1}>
                {(result.confidence * 100).toFixed(1)}%
              </Text>
              <Text fontSize="xs" color="gray.600" mt={0.5}>
                {result.confidence > 0.9 ? "Alta precision local" : "Precision estandar"}
              </Text>
            </Box>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>
    </Flex>
  );
}
