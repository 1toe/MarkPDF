import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno de Vercel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: any, res: any) {
  // Handle CORS if needed
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { text, prompt } = body;

    if (!text && !prompt) {
      return res.status(400).json({ error: "Se requiere texto o una pregunta para el análisis." });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: `Contexto del documento PDF:\n\n${(text || "").slice(0, 45000)}\n\nPregunta / Instrucción: ${prompt || "Resume este documento y resalta los puntos clave."}`,
    });

    const analysis = response.text || "No se pudo generar una respuesta.";
    return res.status(200).json({ analysis });
  } catch (err: any) {
    console.error("Vercel AI Analyze error:", err);
    return res.status(500).json({
      error: err.message || "Error al procesar la solicitud con Gemini AI en Vercel.",
    });
  }
}
