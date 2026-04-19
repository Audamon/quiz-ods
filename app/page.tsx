"use client";

import { useState, useEffect } from "react";
import { getQuestions } from "@/services/questionService";
import { Question } from "@/specs/quiz";
import Deck from "@/components/Deck";
import { motion, AnimatePresence } from "framer-motion";

export default function JogoPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<
    "loading" | "playing" | "finished"
  >("loading");

  // Carrega as perguntas ao iniciar
  useEffect(() => {
    async function loadData() {
      const data = await getQuestions(false); // false = usa o JSON local
      setQuestions(data);
      setGameState("playing");
    }
    loadData();
  }, []);

  const handleAnswer = (selectedIndex: number) => {
    const isCorrect = selectedIndex === questions[currentIndex].answerIndex;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setIsAnswerCorrect(true);
      // Aqui você pode adicionar um som ou feedback visual de acerto
    } else {
      setIsAnswerCorrect(false);
    }

    // Espera um pouco para o jogador ver o feedback e pula para a próxima
    // setTimeout(() => {
    //   if (currentIndex < questions.length - 1) {
    //     setCurrentIndex((prev) => prev + 1);
    //     setIsAnswerCorrect(null); // Reseta o feedback para a próxima pergunta
    //   } else {
    //     setGameState("finished");
    //   }
    // }, 500);
  };
  const handleNextQuestion = () => {
    // Espera um pouco para o jogador ver o feedback e pula para a próxima
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsAnswerCorrect(null); // Reseta o feedback para a próxima pergunta
      } else {
        setGameState("finished");
      }
    }, 1500);
  };

  if (gameState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Carregando Deck...
      </div>
    );
  }

  if (gameState === "finished") {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white">
        <h1 className="text-3xl font-bold mb-4">Fim de Jogo!</h1>
        <p className="text-xl">
          Você acertou {score} de {questions.length} questões.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-blue-600 px-6 py-2 h-10 w-38 rounded-full font-bold transition-colors cursor-pointer
          hover:bg-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          style={{
            borderRadius: "8px",
            backgroundColor: "#155dfc",
          }}
        >
          Jogar Novamente
        </button>
      </main>
    );
  }

  return (
    <main
      className="flex w-full flex-col items-center justify-center bg-slate-900 p-4 gap-8 overflow-auto min-h-screen"
      style={{ padding: "16px" }}
    >
      {/* HUD de Progresso */}
      <div className=" top-10 shrink-0 flex flex-col items-center">
        <span className="text-blue-400 text-sm font-mono uppercase tracking-widest">
          Progresso
        </span>
        <div className="text-white text-3xl font-black">
          {currentIndex + 1}{" "}
          <span className="text-slate-500 text-lg">/ {questions.length}</span>
        </div>
      </div>

      {/* Área do Jogo com Animação de Transição */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full flex justify-center align-middle "
        >
          <Deck
            question={questions[currentIndex]}
            currentIndex={currentIndex}
            onAnswer={handleAnswer}
            isAnswerCorrect={isAnswerCorrect}
            onNextQuestion={handleNextQuestion}
          />
        </motion.div>
      </AnimatePresence>

      {/* Pontuação atual (discreto) */}
      <div className=" bottom-10 shrink-0 text-slate-400 text-sm">
        Pontuação: <span className="text-white font-bold">{score}</span>
      </div>
    </main>
  );
}
