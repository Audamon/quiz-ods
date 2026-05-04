import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Question } from "@/specs/quiz";

export const dynamic = "force-dynamic";

// Cache servidor: persiste enquanto o processo Node estiver rodando
const questionCache = new Map<string, Question[]>();

const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

function buildPrompt(topic: string, ods: number): string {
  return `
    Atue como um educador especializado em Computação e Cultura.
    Gere 5 perguntas de múltipla escolha sobre o tema "${topic}" relacionado com conceitos de Computação e o Objetivo de Desenvolvimento Sustentável (ODS) número ${ods}.

    Retorne um ARRAY de objetos seguindo EXATAMENTE esta estrutura JSON:
    [
      {
        "topic": "${topic}",
        "ods": ${ods},
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "answerIndex": number (0-3),
        "explanation": "string (conectando o tema cultural à computação)"
      }
    ]
    Não adicione blocos de código Markdown, retorne apenas o JSON puro.
  `;
}

function parseQuestions(text: string): Question[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) text = jsonMatch[0];
  return JSON.parse(text);
}

interface GeminiErrorDetail {
  "@type": string;
  retryDelay?: string;
}

interface GeminiError extends Error {
  status?: number;
  errorDetails?: GeminiErrorDetail[];
}

function extractRetryDelay(error: GeminiError): number | null {
  try {
    const retryInfo = error.errorDetails?.find(
      (d) => d["@type"] === "type.googleapis.com/google.rpc.RetryInfo",
    );
    if (retryInfo?.retryDelay) {
      return parseInt(retryInfo.retryDelay.replace("s", ""), 10);
    }
  } catch {
    // ignora
  }
  return null;
}

export async function POST(req: Request) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API Key não configurada" },
      { status: 500 },
    );
  }

  const { topic, ods } = await req.json();
  const cacheKey = `${topic}::${ods}`;

  if (questionCache.has(cacheKey)) {
    return NextResponse.json(questionCache.get(cacheKey));
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const prompt = buildPrompt(topic, ods);
  let lastError: GeminiError | null = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel(
        {
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        },
        { apiVersion: "v1beta" },
      );

      const result = await model.generateContent(prompt);
      const questions: Question[] = parseQuestions(result.response.text());

      const questionsWithIds = questions.map((q, index) => ({
        ...q,
        id: `gen-${Date.now()}-${index}`,
      }));

      questionCache.set(cacheKey, questionsWithIds);
      return NextResponse.json(questionsWithIds);
    } catch (error) {
      lastError = error as GeminiError;
      console.error(`Erro com modelo ${modelName}:`, lastError.message);

      // Só tenta o próximo modelo se for erro de quota (429)
      if (lastError.status !== 429) break;
    }
  }

  console.error("Todos os modelos falharam:", lastError);

  const retryAfter = lastError ? extractRetryDelay(lastError) : null;
  return NextResponse.json(
    {
      error: "Falha ao gerar perguntas dinâmicas",
      details: lastError?.message,
      ...(retryAfter && { retryAfterSeconds: retryAfter }),
    },
    { status: lastError?.status ?? 500 },
  );
}
