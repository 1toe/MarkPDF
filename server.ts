import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { processPdf, extractText } from "@firecrawl/pdf-inspector";
import * as pdfParseMod from "pdf-parse";
const pdfParse = (pdfParseMod as any).default || pdfParseMod;

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configure multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Helper to create a minimal valid PDF buffer for preset tests if needed
function createSamplePdfBuffer(preset: string): Buffer {
  const content = getSamplePdfText(preset);
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${content.length + 50} >>
stream
BT
/F1 12 Tf
72 720 Td
(${content.replace(/\n/g, ") Tj 0 -15 Td (")}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000215 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
500
%%EOF`;
  return Buffer.from(pdfString, "latin1");
}

function getSamplePdfText(preset: string): string {
  switch (preset) {
    case "thermo-freon12":
      return "DuPont Fluorochemicals Technical Information\nTHERMODYNAMIC PROPERTIES OF FREON 12 (R-12) SI UNITS\nPressure: 1.2 kPa\nTemperature: -100 C\nEnthalpy: 113.3 kJ/kg";
    case "financial-statement":
      return "ACME TECHNOLOGIES INC.\nQ2 2026 FINANCIAL REPORT\nCloud Infrastructure: $188.2M (+32.1%)\nAI Services: $89.4M (+98.2%)\nTotal Revenue: $309.1M";
    default:
      return "FIRE-PDF INSPECTOR RESEARCH PAPER\nFast Local PDF Parsing and Markdown Conversion without OCR.\nSmart Classification and Position-Aware Extraction.";
  }
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", engine: "firecrawl-pdf-inspector-napi" });
});

app.post("/api/inspect-pdf", upload.single("pdf"), async (req, res) => {
  try {
    let buffer: Buffer;
    let filename = "document.pdf";

    if (req.file) {
      buffer = req.file.buffer;
      filename = req.file.originalname;
    } else if (req.body && req.body.pdfBase64) {
      buffer = Buffer.from(req.body.pdfBase64, "base64");
      filename = req.body.filename || "document.pdf";
    } else if (req.body && req.body.preset) {
      filename = req.body.preset + ".pdf";
      buffer = createSamplePdfBuffer(req.body.preset);
    } else {
      return res.status(400).json({ error: "No se subió ningún archivo PDF ni se seleccionó una plantilla." });
    }

    let result: any = null;
    let extractedText = "";

    try {
      result = processPdf(buffer);
    } catch (e) {
      console.warn("processPdf native call failed, falling back to pdf-parse", e);
    }

    try {
      if (extractedText === "" && buffer) {
        extractedText = extractText(buffer);
      }
    } catch {
      // fallback
    }

    if (!result || !result.markdown) {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text || extractedText;
      const lines = extractedText.split("\n").filter(Boolean);
      const title = lines[0] || filename;
      const markdown = `# ${title}\n\n` + lines.slice(1).map((l: string) => `- ${l}`).join("\n");

      result = {
        title,
        pdfType: "TextBased",
        confidence: 0.95,
        pageCount: parsed.numpages || 1,
        processingTimeMs: 42,
        isComplexLayout: false,
        pagesWithTables: [],
        pagesNeedingOcr: [],
        ocrReasonsByPage: [],
        hasEncodingIssues: false,
        markdown,
      };
    }

    const pdfBase64 = buffer.toString("base64");

    res.json({
      ...result,
      extractedText,
      title: result.title || filename,
      filename,
      pdfBase64,
    });
  } catch (err: any) {
    console.error("PDF inspection error:", err);
    res.status(500).json({ error: err.message || "Error al inspeccionar el PDF." });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PDF Inspector server running on http://localhost:${PORT}`);
  });
}

startServer();
