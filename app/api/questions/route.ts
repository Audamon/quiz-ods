import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { Question } from "@/specs/quiz";
import localQuestions from "@/data/questions.json";

export const dynamic = "force-dynamic";

// Cache servidor: persiste enquanto o processo Node estiver rodando
const questionCache = new Map<string, Question[]>();

const MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

const ODS_DESCRIPTIONS: Record<number, string> = {
  1: "Erradicação da pobreza",
  2: "Fome zero e agricultura sustentável",
  3: "Saúde e bem-estar",
  4: "Educação de qualidade",
  5: "Igualdade de gênero",
  6: "Água potável e saneamento",
  7: "Energia limpa e acessível",
  8: "Trabalho decente e crescimento econômico",
  9: "Indústria, inovação e infraestrutura",
  10: "Redução das desigualdades",
  11: "Cidades e comunidades sustentáveis",
  12: "Consumo e produção responsáveis",
  13: "Ação contra a mudança global do clima",
  14: "Vida na água",
  15: "Vida terrestre",
  16: "Paz, justiça e instituições eficazes",
  17: "Parcerias e meios de implementação",
};

function buildPrompt(topic: string, ods: number): string {
  const odsLabel = ODS_DESCRIPTIONS[ods] ?? "Desenvolvimento Sustentável";
  return `
    Você é um educador especializado em diversidade cultural brasileira.
    Seu objetivo é criar perguntas para um jogo de cartas educativo que valoriza as culturas
    regionais do Brasil e promove o respeito às diferenças, alinhado ao ODS ${ods} — ${odsLabel}.

    Gere 5 perguntas de múltipla escolha sobre "${topic}", abordando aspectos como:
    - Costumes, tradições e manifestações culturais da região
    - Culinária típica, festas, música ou artesanato
    - Gírias, expressões e curiosidades regionais
    - A importância dessa cultura para a identidade e diversidade brasileira

    As perguntas devem ser envolventes e educativas, estimulando o jogador a refletir sobre
    a riqueza cultural do Brasil e a importância de conhecer e respeitar diferentes realidades.
    Varie a posição da resposta correta entre as 5 perguntas: não coloque sempre na mesma opção.
    O answerIndex deve ser distribuído entre 0, 1, 2 e 3 ao longo das perguntas.

    Retorne um ARRAY de objetos seguindo EXATAMENTE esta estrutura JSON:
    [
      {
        "topic": "${topic}",
        "ods": ${ods},
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "answerIndex": number (0-3),
        "explanation": "string (explicando a importância cultural do tema e sua relação com inclusão e diversidade)"
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

  console.warn(
    "Todos os modelos falharam, usando perguntas locais:",
    lastError?.message,
  );

  return NextResponse.json(localQuestions.cartas as Question[]);
}
