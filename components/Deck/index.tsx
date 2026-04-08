"use client";
import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Question } from "@/specs/quiz";

interface DeckProps {
  question: Question;
  onAnswer: (index: number) => void;
  currentIndex: number; // Para animar a entrada de novas cartas
}

export default function Deck({ question, onAnswer, currentIndex }: DeckProps) {
  // Estado para controlar se a carta do topo foi clicada/revelada
  const [isRevealed, setIsRevealed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleCardClick = () => {
    if (!isRevealed) {
      setIsRevealed(true);
    }
  };

  const handleAnswerClick = (index: number) => {
    // Quando responder, primeiro "esconde" a pergunta
    setIsRevealed(false);
    // Espera a animação de saída terminar e chama a função do Page
    setTimeout(() => {
      onAnswer(index);
    }, 300);
  };

  // Variantes para animação da carta
  const cardVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0, y: 20, rotateY: 0 },
    visible: {
      zIndex: 10,
      scale: 1,
      opacity: 1,
      y: 0,
      x: 0, // Resetamos o X
      rotateY: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    revealed: {
      // Adicionamos a opacidade explicitamente como array para evitar que o TS/Framer tente esconder a carta
      opacity: [1, 1, 1],
      x: [0, 450, 0],
      y: [0, 0, 0],
      rotateY: [0, 0, -180],
      scale: [1, 1.05, 1.1],
      zIndex: 1000, // Valor bem alto para garantir que fique acima de tudo
      transition: {
        duration: 0.8,
        times: [0, 0.4, 1],
        ease: "easeInOut",
      },
    },
    hover: {
      zIndex: 50,
      y: -10,
      scale: 1.05,
      transition: { type: "spring", stiffness: 400, damping: 10 },
    },
    // NOVA VARIANTE DE SAÍDA
    exit: {
      y: -1000, // Sobe para fora da tela
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.5, ease: "anticipate" },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto h-[600px] [transform-style:preserve-3d] perspective-1000">
      {/* Container do Monte (Deck) Angulado */}
      <div className="relative w-64 h-80 mb-10 transform-style-3d rotate-x-12">
        {/* Cartas Decorativas de Fundo (Monte) */}
        <div className="absolute inset-0 bg-slate-300 rounded-2xl shadow-sm rotate-6 translate-y-3 translate-x-1" />
        <div className="absolute inset-0 bg-slate-200 rounded-2xl shadow-md -rotate-3 translate-y-2" />

        {/* Carta do Topo (Interativa) */}
        <AnimatePresence mode="wait">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate={isRevealed ? "revealed" : "visible"}
            whileHover={!isRevealed ? "hover" : undefined}
            onClick={handleCardClick}
            className="relative w-full h-full transform-style-3d transition-transform "
          >
            {/* LADO A: FRENTE (Capa) */}
            <div
              className="absolute inset-0 backface-hidden bg-white rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-slate-200 shadow-xl"
              style={{
                transform: "translateZ(1px)", // Joga a frente 1px para "fora"
              }}
            >
              <div className="w-16 h-16 bg-blue-600 rounded-full mb-4 flex items-center justify-center text-white text-3xl font-bold">
                ?
              </div>
              <p className="text-slate-800 font-bold text-center">
                Toque para revelar
              </p>
            </div>

            {/* LADO B: VERSO (Pergunta) */}
            <div
              className="absolute inset-0 backface-hidden bg-blue-700 rounded-2xl p-6 flex flex-col text-white border-2 border-white shadow-xl"
              style={{
                transform: "rotateY(180deg) translateZ(1px)", // Gira e também joga 1px para "fora" do seu próprio plano
              }}
            >
              <span className="text-xs font-bold opacity-70 uppercase">
                {question.topic}
              </span>
              <h2 className="mt-4 text-lg font-medium leading-tight">
                {question.question}
              </h2>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ÁREA DE RESPOSTAS (Aparece abaixo da carta revelada) */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="w-full space-y-3 px-4"
          >
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                className="w-full py-3 px-4 text-left text-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors text-white font-medium shadow-md"
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
