"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Question } from "@/specs/quiz";
import {
  GameSession,
  getOrCreatePlayerId,
  joinOrCreateSession,
  cancelSession,
} from "@/services/multiplayerService";
import { supabase } from "@/lib/supabase";

interface LobbyProps {
  questions: Question[];
  onReady: (session: GameSession, playerId: string) => void;
  onCancel: () => void;
}

type LobbyStatus = "connecting" | "waiting" | "ready";

const POLL_INTERVAL_MS = 2000;

export default function Lobby({ questions, onReady, onCancel }: LobbyProps) {
  const [status, setStatus] = useState<LobbyStatus>("connecting");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advancedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const playerId = getOrCreatePlayerId();

  useEffect(() => {
    let mounted = true;

    const advance = (session: GameSession) => {
      if (!mounted || advancedRef.current) return;
      advancedRef.current = true;
      if (pollRef.current) clearInterval(pollRef.current);
      setStatus("ready");
      setTimeout(() => onReady(session, playerId), 800);
    };

    async function connect() {
      try {
        const sess = await joinOrCreateSession(questions);
        if (!mounted) return;

        if (sess.status === "playing") {
          advance(sess);
          return;
        }

        setStatus("waiting");
        sessionIdRef.current = sess.id;

        // Realtime: recebe o UPDATE quando player 2 entrar
        channelRef.current = supabase
          .channel(`lobby:${sess.id}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "game_sessions",
              filter: `id=eq.${sess.id}`,
            },
            (payload) => {
              const updated = payload.new as GameSession;
              if (updated.status === "playing") advance(updated);
            },
          )
          .subscribe();

        // Polling: fallback caso o evento realtime não chegue
        pollRef.current = setInterval(async () => {
          if (advancedRef.current) return;
          const { data, error } = await supabase
            .from("game_sessions")
            .select("*")
            .eq("id", sess.id)
            .maybeSingle();
if (data?.status === "playing") advance(data as GameSession);
        }, POLL_INTERVAL_MS);
      } catch (err) {
        console.error("Lobby error:", err);
      }
    }

    connect();
    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-white">
      <motion.div
        animate={status === "waiting" ? { rotate: 360 } : { rotate: 0 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
      />

      <h2 className="text-2xl font-bold text-center">
        {status === "connecting" && "Conectando..."}
        {status === "waiting" && "Aguardando adversário..."}
        {status === "ready" && "Adversário encontrado! 🎮"}
      </h2>

      {status === "waiting" && (
        <p className="text-slate-400 text-sm text-center max-w-xs">
          Peça para seu adversário abrir o site e clicar em Multiplayer.
        </p>
      )}

      {status !== "ready" && (
        <button
          onClick={() => {
            if (sessionIdRef.current) cancelSession(sessionIdRef.current);
            onCancel();
          }}
          className="text-slate-500 hover:text-white text-sm underline cursor-pointer transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
