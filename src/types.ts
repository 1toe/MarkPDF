export interface PageOcrReason {
  page: number;
  reasons: string[];
}

export interface PdfResult {
  pdfType: "TextBased" | "Scanned" | "Mixed" | "ImageBased";
  markdown: string;
  pageCount: number;
  processingTimeMs: number;
  pagesNeedingOcr: number[];
  ocrReasonsByPage: PageOcrReason[];
  title: string;
  confidence: number;
  isComplexLayout: boolean;
  pagesWithTables: number[];
  pagesWithColumns: number[];
  hasEncodingIssues: boolean;
  extractedText?: string;
  info?: Record<string, any>;
}
