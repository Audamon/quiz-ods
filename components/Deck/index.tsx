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
    //setIsRevealed(false);
    setIsExiting(true);
    // Espera a animação de saída terminar e chama a função do Page
    setTimeout(() => {
      onAnswer(index);
      // Inicia a animação de saída
    }, 1200);
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
      x: [0, 0, 0],
      y: [0, 0, 0],
      z: [50, 500, 0],
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
      y: -1000,
      rotateY: -180, // Mantém ela virada para o lado da pergunta enquanto sobe
      opacity: 1,
      scale: 0.8,
      transition: {
        duration: 1,
        ease: [0.45, 0, 0.55, 1], // Um ease mais dramático para a saída
      },
    },
  };

  return (
    <div className="flex flex-col items-center shrink-0 justify-center scroll-auto w-full max-w-sm mx-auto gap-8 min-h-screen py-10 [transform-style:preserve-3d] perspective-1000">
      {/* Container do Monte (Deck) Angulado */}
      <div className="relative w-64 h-80 sm:w-58 sm:h-74 mb-10 flex justify-start transform-style-3d rotate-x-12">
        {/* Cartas Decorativas de Fundo (Monte) */}
        <div className="absolute inset-0 bg-slate-300 rounded-2xl shadow-sm rotate-6 translate-y-3 translate-x-1" />
        <div className="absolute inset-0 bg-slate-200 rounded-2xl shadow-md -rotate-3 translate-y-2" />

        {/* Carta do Topo (Interativa) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            variants={cardVariants}
            initial="hidden"
            animate={isExiting ? "exit" : isRevealed ? "revealed" : "visible"}
            exit="exit"
            whileHover={!isRevealed ? "hover" : undefined}
            onClick={handleCardClick}
            className="relative w-full h-full v transform-style-3d transition-transform flex p-6 justify-center items-center "
          >
            {/* LADO A: FRENTE (Capa) */}
            <div
              className="absolute inset-0 backface-hidden bg-white rounded-2xl p-6 flex cursor-pointer flex-col items-center justify-center border-2 border-slate-200 shadow-xl"
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
              className="absolute inset-0 backface-hidden bg-blue-700 rounded-2xl p-4  flex flex-col  text-white border-2 border-white shadow-xl"
              style={{
                display: "flex",
                padding: "16px",
                border: "4px solid white",
                gap: "16px",
                transform: "rotateY(180deg) translateZ(1px)", // Gira e também joga 1px para "fora" do seu próprio plano
              }}
            >
              <div className="text-xs font-bold  uppercase">
                {question.topic}
              </div>
              <div className="mt-4 text-md sm:text-sm font-medium p-6 leading-tight">
                {question.question}
              </div>
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
            className="w-full md:grid md:grid-cols-2  gap-4 p-0"
          >
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                className="text-left text-sm transition-all duration-200 ease-out md:h-22 cursor-pointer
             hover:bg-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                style={{
                  // Forçando a borda que o Tailwind não quis renderizar
                  border: "2px solid #FFFFFF",
                  padding: "4px ",
                  display: "block",
                  backgroundColor: "transparent",
                  outline: "none",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  background: "#155dfc",
                }}
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
