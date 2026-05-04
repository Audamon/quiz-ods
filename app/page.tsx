"use client";

import { useState, useEffect, useRef } from "react";
import { generateQuestions, getQuestions } from "@/services/questionService";
import { Question } from "@/specs/quiz";
import Deck from "@/components/Deck";
import { motion, AnimatePresence } from "framer-motion";
import Menu from "@/components/Menu";

export default function JogoPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<
    "loading" | "playing" | "finished" | "menu"
  >("menu");
  const [gameType, setGameType] = useState<"single" | "ai" | "multi" | "">("");
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    // Criamos o objeto de áudio
    const audio = new Audio(
      "/sounds/841290__geoff-bremner-audio__geoff-bremner-chill-hop-loop-1-concept.wav",
    );
    audio.loop = true; // Fundamental para música de fundo
    audio.volume = 0.15; // Volume bem baixo para não irritar
    bgMusicRef.current = audio;

    // O navegador bloqueia autoplay sem interação.
    // Então tocamos a música assim que o jogo começa de fato.
    if (gameState === "playing") {
      audio
        .play()
        .catch(() => console.log("Aguardando interação para tocar música"));
    }

    return () => {
      audio.pause(); // Limpa ao desmontar
    };
  }, [gameState]); // Dispara quando o estado muda para 'playing'
  // Carrega as perguntas ao iniciar
  useEffect(() => {
    async function loadData() {
      let data: Question[] = [];
      if (gameType === "ai") {
        data = await generateQuestions(
          "Diferenças culturais entre as regiões brasileiras",
          4,
        ); // true = usa a API do Gemini
      } else if (gameType === "single") {
        data = await getQuestions(false); // false = usa o JSON local
      }
      setQuestions(data);
      if (gameState === "loading") {
        setGameState("playing");
      }
    }
    loadData();
  }, [gameState, gameType]);

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
  const resetGame = () => {
    setScore(0);
    setCurrentIndex(0);
    setIsAnswerCorrect(null);
    setGameState("loading");
    setGameType(gameType); // Mantém o tipo de jogo selecionado para recarregar as perguntas corretamente
  };
  const endGame = () => {
    setScore(0);
    setCurrentIndex(0);
    setIsAnswerCorrect(null);
    setGameState("menu");
    setGameType(""); // Reseta o tipo de jogo para o menu inicial
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
      <main className="flex h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white gap-4">
        <h1 className="text-3xl font-bold mb-4">Fim de Jogo!</h1>
        <p className="text-xl">
          Você acertou {score} de {questions.length} questões.
        </p>
        <button
          onClick={() => resetGame()}
          className="mt-6 bg-blue-600 px-6 py-2 h-10 w-38 rounded-full font-bold transition-colors cursor-pointer
          hover:bg-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          style={{
            borderRadius: "8px",
            backgroundColor: "#155dfc",
          }}
        >
          Jogar Novamente
        </button>
        <button
          onClick={() => endGame()}
          className="mt-6 bg-blue-600 px-6 py-2 h-10 w-38 rounded-full font-bold transition-colors cursor-pointer
          hover:bg-white/20 hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          style={{
            borderRadius: "8px",
            backgroundColor: "#155dfc",
          }}
        >
          Voltar ao menu
        </button>
      </main>
    );
  }

  return (
    <main
      className="flex w-full flex-col items-center justify-center bg-slate-900 p-4 gap-8 overflow-auto min-h-screen"
      style={{ padding: "16px" }}
    >
      {gameState === "menu" ? (
        <Menu
          onStartSinglePlayer={() => setGameState("loading")}
          onSetGameType={setGameType}
        />
      ) : (
        <>
          {/* HUD de Progresso */}
          <div className=" top-10 shrink-0 flex flex-col items-center">
            <span className="text-blue-400 text-sm font-mono uppercase tracking-widest">
              Progresso
            </span>
            <div className="text-white text-3xl font-black">
              {currentIndex + 1}{" "}
              <span className="text-slate-500 text-lg">
                / {questions.length}
              </span>
            </div>
          </div>

          {/* Disclaimer modo IA */}
          {gameType === "ai" && (
            <p className="text-xs text-slate-500 text-center max-w-sm">
              ⚠️ Perguntas geradas por inteligência artificial. O conteúdo pode conter imprecisões.
            </p>
          )}

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
        </>
      )}
      <button
        onClick={toggleMute}
        className="fixed bottom-4 right-4 p-2 bg-slate-800 rounded-full hover:cursor-pointer"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </main>
  );
}
