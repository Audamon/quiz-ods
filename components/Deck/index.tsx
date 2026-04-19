"use client";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Question } from "@/specs/quiz";

interface DeckProps {
  question: Question;
  onAnswer: (index: number) => void;
  currentIndex: number; // Para animar a entrada de novas cartas
  isAnswerCorrect: boolean | null; // Para feedback visual de acerto/erro
  onNextQuestion: () => void; // Para avançar para a próxima pergunta após feedback
}

export default function Deck({
  question,
  onAnswer,
  currentIndex,
  isAnswerCorrect,
  onNextQuestion,
}: DeckProps) {
  // Estado para controlar se a carta do topo foi clicada/revelada
  const [isRevealed, setIsRevealed] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const flipSoundRef = useRef<HTMLAudioElement | null>(null);
  const whooshSoundRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingWhoosh = useRef(false);
  const playWhooshSound = () => {
    if (isPlayingWhoosh.current) return; // Evita sobreposição de sons
    if (!whooshSoundRef.current) {
      whooshSoundRef.current = new Audio("/sounds/whoosh.mp3");
      whooshSoundRef.current.playbackRate = 0.9;
      whooshSoundRef.current.volume = 0.3;
    }
    isPlayingWhoosh.current = true;
    whooshSoundRef.current.currentTime = 0;
    const promise = whooshSoundRef.current.play();

    if (promise !== undefined) {
      promise.catch((error) => {
        console.error("Erro ao reproduzir:", error);
        whooshSoundRef.current = new Audio("/sounds/whoosh.mp3");
        whooshSoundRef.current.play();
      });
    }
  };
  useEffect(() => {
    isPlayingWhoosh.current = false;
  }, [currentIndex]);
  const playFlipSound = () => {
    // Cria o objeto apenas se não existir ou se a fonte estiver vazia
    if (!flipSoundRef.current) {
      flipSoundRef.current = new Audio("/sounds/flip.wav");
      flipSoundRef.current.playbackRate = 0.7 + Math.random() * 0.2;
      flipSoundRef.current.volume = 0.5;
    }

    // Se o link externo falhou, pode ser política de segurança (CORS).
    // Com arquivo local, garantimos que o caminho seja absoluto
    flipSoundRef.current.currentTime = 0;
    const promise = flipSoundRef.current.play();

    if (promise !== undefined) {
      promise.catch((error) => {
        // Se cair aqui, o navegador bloqueou por falta de interação prévia
        console.error("Erro ao reproduzir:", error);

        // Tática de "Recuperação": Tentar re-instanciar
        flipSoundRef.current = new Audio("/sounds/flip.wav");
        flipSoundRef.current.play();
      });
    }
  };
  const handleCardClick = () => {
    if (!isRevealed) {
      playFlipSound();
      setIsRevealed(true);
    }
  };

  const handleAnswerClick = (index: number) => {
    setSelectedIndex(index);
    setIsAnswered(true);

    onAnswer(index);
  };
  const handleNextQuestionClick = () => {
    setIsAnswered(false);
    setIsExiting(true);
    setTimeout(() => {
      playWhooshSound();
    }, 400);
    setTimeout(() => {
      //setIsRevealed(false);
      setSelectedIndex(null);
      onNextQuestion();
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
    <div className="flex flex-col lg:flex-row 2xl:flex-col items-center shrink-0 justify-center scroll-auto w-full max-w-4xl mx-auto gap-8  py-10 [transform-style:preserve-3d] perspective-1000">
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
            key="answers-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className=" grid grid-cols-2  gap-4 p-0"
          >
            {question.options.map((option, index) => (
              <button
                key={`${currentIndex}-${index}-`} // Garantindo chave única mesmo com opções repetidas
                onClick={() => handleAnswerClick(index)}
                className="text-left text-sm transition-all duration-200 ease-out md:h-22 md:w-48 cursor-pointer
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
                  background: isAnswered
                    ? index === question.answerIndex
                      ? "#4ade80" // sempre verde = resposta correta
                      : index === selectedIndex
                        ? "#f87171" // vermelho = o que o usuário clicou errado
                        : "#155dfc" // outros ficam azul
                    : "#155dfc",
                }}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, z: 600 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-center text-lg font-bold mt-4 fixed top-1/4 left-1/4  flex flex-col justify-center items-center w-1/2 h-1/2"
            style={{
              zIndex: "9999999",
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0.92) 30%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
              filter: "drop-shadow(0 0 30px rgba(0,0,0,0.5))",
            }}
          >
            {isAnswerCorrect ? "Correto!" : "Errado!"}
            <button
              onClick={handleNextQuestionClick}
              className=" w-48 ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer"
              style={{ backgroundColor: "#155dfc", borderRadius: "8px" }}
            >
              Próxima
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
