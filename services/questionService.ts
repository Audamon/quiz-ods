import localQuestions from "@/data/questions.json";
import { Question } from "@/specs/quiz";
export const getQuestions = async (useAi: false): Promise<Question[]> => {
  if (useAi) {
    return [];
  }
  return localQuestions.cartas as Question[];
};
