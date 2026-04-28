import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Question } from "@/specs/quiz"; // Certifique-se de ter esse type
export const dynamic = "force-dynamic"; // Força a execução dinâmica para cada requisição
export async function POST(req: Request) {
  try {
    // Defina a chave fora para falhar cedo caso não exista
    const API_KEY = process.env.GEMINI_API_KEY;
    const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
    // 1. Validação da API Key
    if (!genAI) {
      return NextResponse.json(
        { error: "API Key não configurada" },
        { status: 500 },
      );
    }

    const { topic, ods } = await req.json();

    const model = genAI.getGenerativeModel(
      {
        model: "gemini-1.5-flash",
        //generationConfig: { responseMimeType: "application/json" },
      },
      { apiVersion: "v1" },
    );

    const prompt = `
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

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/); // Procura o início [ e fim ] do array
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    // 2. Parse e tipagem
    const questions: Question[] = JSON.parse(text);

    // 3. Retorno correto com NextResponse
    const questionsWithIds = questions.map((q, index) => ({
      ...q,
      id: q.id || `gen-${Date.now()}-${index}`,
    }));

    return NextResponse.json(questionsWithIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Erro na API Gemini:", error);

    // Em vez de chamar getQuestions aqui (que é client-side),
    // retornamos um erro para o front-end decidir o que fazer.
    return NextResponse.json(
      {
        error: "Falha ao gerar perguntas dinâmicas",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
