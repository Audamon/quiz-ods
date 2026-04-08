export interface Question {
  id: string;
  topic: string; // Ex: "Cultura Gaúcha"
  ods: number; // Ex: 4
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string; // Explicação educativa (Cultura + Computação)
}
