/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useState } from "react";
import {
  Alert,
  Box,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Dropzone } from "./components/Dropzone";
import { UploadProgressModal } from "./components/UploadProgressModal";
import { PdfResult } from "./types";
import { saveHistoryItem, HistoryItem } from "./lib/db";
import { parsePdfClientSide } from "./lib/pdfClientParser";

// Bundle optimization: InspectorResults is large (only needed after a file is processed)
const InspectorResults = lazy(() =>
  import("./components/InspectorResults").then((m) => ({
    default: m.InspectorResults,
  }))
);

export default function App() {
  const [result, setResult] = useState<(PdfResult & { filename?: string; pdfBase64?: string }) | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.includes(",") ? res.split(",")[1] : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleInspect = async (file?: File, preset?: string) => {
    setIsLoading(true);
    setError(null);

    let data: (PdfResult & { filename?: string; pdfBase64?: string }) | null = null;

    try {
      // 1. Try server API first
      try {
        let res: Response;
        if (file) {
          const pdfBase64 = await fileToBase64(file);
          res = await fetch("/api/inspect-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64, filename: file.name }),
          });
        } else {
          res = await fetch("/api/inspect-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preset: preset || "sample" }),
          });
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const json = await res.json();
          if (res.ok && !json.error) {
            data = json;
          }
        }
      } catch (apiErr) {
        console.warn("Server API inspect-pdf call failed, falling back to local parser:", apiErr);
      }

      // 2. Fallback to robust client-side parser if API was 404/500/unreachable on Vercel
      if (!data) {
        if (file) {
          data = await parsePdfClientSide(file);
        } else if (preset) {
          const sampleBlob = new Blob(
            [`FIRE-PDF INSPECTOR RESEARCH PAPER\nFast Local PDF Parsing and Markdown Conversion without OCR.\nSmart Classification and Position-Aware Extraction.`],
            { type: "application/pdf" }
          );
          const sampleFile = new File([sampleBlob], `${preset}.pdf`, { type: "application/pdf" });
          data = await parsePdfClientSide(sampleFile, preset);
        } else {
          throw new Error("No se proporcionó ningún archivo ni plantilla.");
        }
      }

      const itemId = "pdf_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
      const historyItem: HistoryItem = {
        id: itemId,
        filename: data.filename || file?.name || "documento.pdf",
        timestamp: Date.now(),
        result: data,
        pdfBase64: data.pdfBase64,
      };

      await saveHistoryItem(historyItem);
      window.dispatchEvent(new Event("pdf-inspected"));

      setCurrentId(itemId);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Ocurrió un error al inspeccionar el PDF.";
      console.error("Inspection error:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    if (isLoading) return;
    setCurrentId(item.id);
    setResult(item.result);
    setError(null);
  };

  const handleNew = () => {
    if (isLoading) return;
    setResult(null);
    setCurrentId(null);
  };

  return (
    <Flex
      minH="100vh"
      bg="gray.50"
      flexDirection={{ base: "column", md: "row" }}
      pointerEvents={isLoading ? "none" : "auto"}
      userSelect={isLoading ? "none" : "auto"}
    >
      <UploadProgressModal isOpen={isLoading} />

      {/* Navigation Sidebar */}
      <Sidebar
        currentId={currentId}
        onSelect={handleSelectHistory}
        onNew={handleNew}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <Box flex="1" minW={0} pl={{ base: 0, md: "320px" }} display="flex" flexDirection="column">
        <Header onToggleSidebar={() => { if (!isLoading) setSidebarOpen(true); }} />

        <Box as="main" mx="auto" w="full" maxW="6xl" px={{ base: 4, md: 8 }} py={8}>
          {error && (
            <Alert.Root status="error" mb={6} borderRadius="md">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}

          {!result ? (
            <Box mx="auto" maxW="2xl" py={8}>
              <Box textAlign="center" mb={8}>
                <Text as="h2" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" letterSpacing="tight" color="gray.900">
                  Inspección y Extracción de PDF
                </Text>
                <Text mt={3} fontSize="base" color="gray.700" maxW="lg" mx="auto">
                  Clasifica archivos PDF, extrae texto consciente de su posición, detecta tablas y convierte a Markdown limpio sin necesidad de OCR.
                </Text>
              </Box>
              <Dropzone onInspect={handleInspect} isLoading={isLoading} />
            </Box>
          ) : (
            <Suspense fallback={
              <Flex justify="center" align="center" py={16}>
                <Spinner size="xl" color="orange.600" />
              </Flex>
            }>
              <InspectorResults
                result={result}
                onReset={() => {
                  if (isLoading) return;
                  setResult(null);
                  setCurrentId(null);
                }}
              />
            </Suspense>
          )}
        </Box>

        <Box as="footer" borderTopWidth="1px" borderColor="gray.200" bg="white" py={4} px={{ base: 4, md: 8 }} mt="auto">
          <Flex mx="auto" maxW="6xl" justify="space-between" align="center" direction={{ base: "column", sm: "row" }} gap={2} fontSize="xs" color="gray.600">
            <Text>
              MarkPDF &copy; {new Date().getFullYear()} · Todos los derechos reservados.
            </Text>
            <Text>
              Extracción y clasificación basada en{" "}
              <Box
                as="a"
                href="https://github.com/mendableai/firecrawl"
                target="_blank"
                rel="noopener noreferrer"
                color="orange.600"
                fontWeight="semibold"
                _hover={{ textDecoration: "underline" }}
              >
                Firecrawl pdf-inspector
              </Box>{" "}
              (Licencia Apache-2.0).
            </Text>
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}
