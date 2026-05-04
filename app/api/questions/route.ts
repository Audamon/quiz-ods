import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { Question } from "@/specs/quiz";
import localQuestions from "@/data/questions.json";

export const dynamic = "force-dynamic";

// Cache servidor: persiste enquanto o processo Node estiver rodando
const questionCache = new Map<string, Question[]>();

const MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

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

interface GeminiError extends Error {
  status?: number;
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

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = buildPrompt(topic, ods);
  let lastError: GeminiError | null = null;

  for (const modelName of MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });

      const questions: Question[] = parseQuestions(result.text ?? "");

      const questionsWithIds = questions.map((q, index) => ({
        ...q,
        id: `gen-${Date.now()}-${index}`,
      }));

      questionCache.set(cacheKey, questionsWithIds);
      return NextResponse.json(questionsWithIds);
    } catch (error) {
      lastError = error as GeminiError;
      console.error(`Erro com modelo ${modelName}:`, lastError.message);

      // Continua para o próximo modelo em caso de quota (429) ou modelo indisponível (404)
      if (lastError.status !== 429 && lastError.status !== 404) break;
    }
  }

  console.warn("Todos os modelos falharam, usando perguntas locais:", lastError?.message);

  return NextResponse.json(localQuestions.cartas as Question[]);
}
