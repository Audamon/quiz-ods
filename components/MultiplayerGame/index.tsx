"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Question } from "@/specs/quiz";
import {
  GameSession,
  GameAnswer,
  submitAnswer,
  advanceQuestion,
} from "@/services/multiplayerService";

interface Props {
  initialSession: GameSession;
  playerId: string;
  onGameEnd: (session: GameSession) => void;
}

function getWinner(answers: GameAnswer[], correctIndex: number): string | null {
  const correct = [...answers]
    .filter((a) => a.answer_index === correctIndex)
    .sort(
      (a, b) =>
        new Date(a.answered_at).getTime() - new Date(b.answered_at).getTime(),
    );
  return correct.length > 0 ? correct[0].player_id : null;
}

export default function MultiplayerGame({
  initialSession,
  playerId,
  onGameEnd,
}: Props) {
  const [session, setSession] = useState<GameSession>(initialSession);
  const [myAnswer, setMyAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<GameAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const advanceCalledRef = useRef(false);

  const isPlayer1 = playerId === session.player1_id;
  const qIndex = session.current_question_index;
  const question: Question = session.questions[qIndex];
  const opponentId = isPlayer1 ? session.player2_id! : session.player1_id;

  const myAnswerObj = answers.find((a) => a.player_id === playerId);
  const opponentAnswerObj = answers.find((a) => a.player_id === opponentId);
  const bothAnswered = !!myAnswerObj && !!opponentAnswerObj;

  const winner = bothAnswered ? getWinner(answers, question.answerIndex) : null;
  const iWon = winner === playerId;

  const myScore = isPlayer1 ? session.score_p1 : session.score_p2;
  const opponentScore = isPlayer1 ? session.score_p2 : session.score_p1;

  // Reseta estado local a cada nova pergunta
  useEffect(() => {
    setMyAnswer(null);
    setAnswers([]);
    setShowResult(false);
    advanceCalledRef.current = false;
  }, [qIndex]);

  // Avança automaticamente quando os dois respondem
  useEffect(() => {
    if (!bothAnswered || advanceCalledRef.current) return;
    advanceCalledRef.current = true;
    setShowResult(true);

    if (isPlayer1) {
      setTimeout(() => {
        advanceQuestion(session, winner);
      }, 2500);
    }
  }, [bothAnswered]);

  // Realtime: mudanças na sessão (índice da pergunta, placar, status)
  useEffect(() => {
    const ch = supabase
      .channel(`mp-session:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as GameSession;
          setSession(updated);
          if (updated.status === "finished") {
            setTimeout(() => onGameEnd(updated), 2000);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session.id]);

  // Realtime: respostas inseridas nesta sessão
  useEffect(() => {
    const ch = supabase
      .channel(`mp-answers:${session.id}:${qIndex}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_answers",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const ans = payload.new as GameAnswer;
          if (ans.question_index !== qIndex) return;
          setAnswers((prev) =>
            prev.find((a) => a.player_id === ans.player_id)
              ? prev
              : [...prev, ans],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session.id, qIndex]);

  const handleAnswer = async (index: number) => {
    if (myAnswer !== null) return;
    setMyAnswer(index);

    // Adiciona optimisticamente para calcular resultado local sem esperar DB
    const optimistic: GameAnswer = {
      id: crypto.randomUUID(),
      session_id: session.id,
      player_id: playerId,
      question_index: qIndex,
      answer_index: index,
      answered_at: new Date().toISOString(),
    };
    setAnswers((prev) => [...prev, optimistic]);

    await submitAnswer(session.id, qIndex, index);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-5 text-white px-4">
      {/* Placar */}
      <div className="flex w-full justify-between items-center bg-slate-800 rounded-2xl px-6 py-3">
        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Você
          </div>
          <div className="text-3xl font-black text-blue-400">{myScore}</div>
        </div>
        <div className="text-center text-slate-500 text-sm font-mono">
          {qIndex + 1} / {session.questions.length}
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wide">
            Adversário
          </div>
          <div className="text-3xl font-black text-red-400">
            {opponentScore}
          </div>
        </div>
      </div>

      {/* Pergunta */}
      <div className="w-full bg-blue-700 rounded-2xl p-6 border-2 border-white">
        <div className="text-xs font-bold uppercase text-blue-200 mb-2">
          {question.topic}
        </div>
        <p className="text-lg font-medium leading-snug">{question.question}</p>
      </div>

      {/* Opções */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {question.options.map((option, index) => {
          const isCorrect = index === question.answerIndex;
          const isMyChoice = myAnswer === index;
          const isOpponentChoice =
            opponentAnswerObj?.answer_index === index && myAnswer !== null;

          let bg = "#155dfc";
          if (myAnswer !== null) {
            if (isCorrect) bg = "#4ade80";
            else if (isMyChoice) bg = "#f87171";
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={myAnswer !== null}
              className="relative text-left text-sm p-3 rounded-xl border-2 border-white transition-all cursor-pointer disabled:cursor-default hover:brightness-110"
              style={{ backgroundColor: bg, minHeight: "72px" }}
            >
              {option}
              {isMyChoice && (
                <span className="absolute top-1 right-1 text-xs">👤</span>
              )}
              {isOpponentChoice && !isMyChoice && (
                <span className="absolute top-1 right-1 text-xs">🎭</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <p className="text-sm text-slate-400 text-center">
        {myAnswer === null && "Responda rápido!"}
        {myAnswer !== null && !opponentAnswerObj && "Aguardando adversário..."}
      </p>

      {/* Explicação após responder */}
      {myAnswer !== null && opponentAnswerObj && !showResult && (
        <p className="text-xs text-slate-400 text-center max-w-sm">
          {question.explanation}
        </p>
      )}

      {/* Overlay de resultado */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(0,0,0,0.92) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)",
            }}
          >
            <div className="text-center px-8">
              <div className="text-6xl mb-4">
                {winner === null ? "🤝" : iWon ? "🏆" : "😞"}
              </div>
              <div className="text-2xl font-black text-white">
                {winner === null && "Nenhum acertou!"}
                {iWon && "Você foi mais rápido!"}
                {!iWon && winner !== null && "Adversário foi mais rápido!"}
              </div>
              <div className="text-slate-400 mt-2 text-sm">
                Próxima pergunta em instantes...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
