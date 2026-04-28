import localQuestions from "@/data/questions.json";
import { Question } from "@/specs/quiz";

export const getQuestions = async (useAi: false): Promise<Question[]> => {
  if (useAi) {
    return [];
  }
  return localQuestions.cartas as Question[];
};
export const generateQuestions = async (
  topic: string,
  ods: number,
): Promise<Question[]> => {
  try {
    const response = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, ods }),
    });

    if (!response.ok) throw new Error("Erro na requisição");

    return await response.json();
  } catch (error) {
    console.error("Erro ao gerar perguntas:", error);
    return getQuestions(false); // fallback para perguntas locais em caso de erro
  }
};
