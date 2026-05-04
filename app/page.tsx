"use client";

import { useState, useEffect, useRef } from "react";
import { generateQuestions, getQuestions } from "@/services/questionService";
import { Question } from "@/specs/quiz";
import { GameSession } from "@/services/multiplayerService";
import Deck from "@/components/Deck";
import Lobby from "@/components/Lobby";
import MultiplayerGame from "@/components/MultiplayerGame";
import { motion, AnimatePresence } from "framer-motion";
import Menu from "@/components/Menu";

type GameState =
  | "menu"
  | "loading"
  | "playing"
  | "lobby"
  | "multi-playing"
  | "finished"
  | "multi-finished";

export default function JogoPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [gameState, setGameState] = useState<GameState>("menu");
  const [gameType, setGameType] = useState<"single" | "ai" | "multi" | "">("");
  const [isMuted, setIsMuted] = useState(false);

  // Multiplayer
  const [multiSession, setMultiSession] = useState<GameSession | null>(null);
  const [multiPlayerId, setMultiPlayerId] = useState<string | null>(null);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  const toggleMute = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    const audio = new Audio(
      "/sounds/841290__geoff-bremner-audio__geoff-bremner-chill-hop-loop-1-concept.wav",
    );
    audio.loop = true;
    audio.volume = 0.15;
    bgMusicRef.current = audio;

    if (gameState === "playing" || gameState === "multi-playing") {
      audio
        .play()
        .catch(() => console.log("Aguardando interação para tocar música"));
    }

    return () => {
      audio.pause();
    };
  }, [gameState]);

  // Carrega perguntas sempre via estado "loading", depois decide o próximo estado
  useEffect(() => {
    if (gameState !== "loading") return;

    async function loadData() {
      let data: Question[] = [];
      if (gameType === "ai" || gameType === "multi") {
        data = await generateQuestions(
          "Diferenças culturais entre as regiões brasileiras",
          4,
        );
      } else if (gameType === "single") {
        data = await getQuestions(false);
      }
      setQuestions(data);
      setGameState(gameType === "multi" ? "lobby" : "playing");
    }

    loadData();
  }, [gameState, gameType]);

  const handleAnswer = (selectedIndex: number) => {
    const isCorrect = selectedIndex === questions[currentIndex].answerIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      setIsAnswerCorrect(true);
    } else {
      setIsAnswerCorrect(false);
    }
  };

  const handleNextQuestion = () => {
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsAnswerCorrect(null);
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
  };

  const endGame = () => {
    setScore(0);
    setCurrentIndex(0);
    setIsAnswerCorrect(null);
    setMultiSession(null);
    setMultiPlayerId(null);
    setGameState("menu");
    setGameType("");
  };

  const handleLobbyReady = (session: GameSession, playerId: string) => {
    setMultiSession(session);
    setMultiPlayerId(playerId);
    setGameState("multi-playing");
  };

  const handleMultiGameEnd = (finalSession: GameSession) => {
    setMultiSession(finalSession);
    setGameState("multi-finished");
  };

  // --- Tela de carregamento ---
  if (gameState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-white">
        Carregando Deck...
      </div>
    );
  }

  // --- Fim de jogo single/AI ---
  if (gameState === "finished") {
    return (
      <main className="flex h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white gap-4">
        <h1 className="text-3xl font-bold mb-4">Fim de Jogo!</h1>
        <p className="text-xl">
          Você acertou {score} de {questions.length} questões.
        </p>
        <button
          onClick={resetGame}
          className="mt-6 px-6 py-2 h-10 w-38 rounded-lg font-bold cursor-pointer hover:bg-white/20 hover:scale-[1.02]"
          style={{ backgroundColor: "#155dfc" }}
        >
          Jogar Novamente
        </button>
        <button
          onClick={endGame}
          className="px-6 py-2 h-10 w-38 rounded-lg font-bold cursor-pointer hover:bg-white/20 hover:scale-[1.02]"
          style={{ backgroundColor: "#155dfc" }}
        >
          Voltar ao menu
        </button>
      </main>
    );
  }

  // --- Fim de jogo multiplayer ---
  if (gameState === "multi-finished" && multiSession) {
    const isPlayer1 = multiPlayerId === multiSession.player1_id;
    const myScore = isPlayer1 ? multiSession.score_p1 : multiSession.score_p2;
    const opponentScore = isPlayer1
      ? multiSession.score_p2
      : multiSession.score_p1;
    const iWon = myScore > opponentScore;
    const isDraw = myScore === opponentScore;

    return (
      <main className="flex h-screen flex-col items-center justify-center bg-slate-900 p-4 text-white gap-4">
        <div className="text-6xl mb-2">
          {isDraw ? "🤝" : iWon ? "🏆" : "😞"}
        </div>
        <h1 className="text-3xl font-bold">
          {isDraw ? "Empate!" : iWon ? "Você venceu!" : "Adversário venceu!"}
        </h1>
        <div className="flex gap-12 mt-4">
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase">Você</div>
            <div className="text-4xl font-black text-blue-400">{myScore}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 uppercase">Adversário</div>
            <div className="text-4xl font-black text-red-400">
              {opponentScore}
            </div>
          </div>
        </div>
        <button
          onClick={endGame}
          className="mt-6 px-6 py-2 rounded-lg font-bold cursor-pointer hover:bg-white/20 hover:scale-[1.02]"
          style={{ backgroundColor: "#155dfc" }}
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
      {gameState === "menu" && (
        <Menu
          onStartSinglePlayer={() => setGameState("loading")}
          onSetGameType={(type) => setGameType(type)}
        />
      )}

      {gameState === "lobby" && (
        <Lobby
          questions={questions}
          onReady={handleLobbyReady}
          onCancel={endGame}
        />
      )}

      {gameState === "multi-playing" && multiSession && multiPlayerId && (
        <MultiplayerGame
          initialSession={multiSession}
          playerId={multiPlayerId}
          onGameEnd={handleMultiGameEnd}
        />
      )}

      {(gameState === "playing") && (
        <>
          <div className="top-10 shrink-0 flex flex-col items-center">
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

          {gameType === "ai" && (
            <p className="text-xs text-slate-500 text-center max-w-sm">
              ⚠️ Perguntas geradas por inteligência artificial. O conteúdo pode
              conter imprecisões.
            </p>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center align-middle"
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

          <div className="bottom-10 shrink-0 text-slate-400 text-sm">
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
