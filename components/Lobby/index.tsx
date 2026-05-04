"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Question } from "@/specs/quiz";
import {
  GameSession,
  getOrCreatePlayerId,
  joinOrCreateSession,
} from "@/services/multiplayerService";
import { supabase } from "@/lib/supabase";

interface LobbyProps {
  questions: Question[];
  onReady: (session: GameSession, playerId: string) => void;
  onCancel: () => void;
}

type LobbyStatus = "connecting" | "waiting" | "ready";

export default function Lobby({ questions, onReady, onCancel }: LobbyProps) {
  const [status, setStatus] = useState<LobbyStatus>("connecting");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const playerId = getOrCreatePlayerId();

  useEffect(() => {
    let mounted = true;

    async function connect() {
      try {
        const sess = await joinOrCreateSession(questions);
        if (!mounted) return;

        if (sess.status === "playing") {
          setStatus("ready");
          setTimeout(() => onReady(sess, playerId), 800);
          return;
        }

        setStatus("waiting");

        const advance = (session: GameSession) => {
          if (!mounted) return;
          setStatus("ready");
          setTimeout(() => onReady(session, playerId), 800);
        };

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
          .subscribe(async (subscriptionStatus) => {
            // Quando a subscription confirma que está ativa, verifica se o
            // player 2 já entrou enquanto a conexão estava sendo estabelecida
            if (subscriptionStatus === "SUBSCRIBED") {
              const { data } = await supabase
                .from("game_sessions")
                .select("*")
                .eq("id", sess.id)
                .maybeSingle();
              if (data && data.status === "playing") advance(data as GameSession);
            }
          });
      } catch (err) {
        console.error("Lobby error:", err);
      }
    }

    connect();
    return () => {
      mounted = false;
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
          onClick={onCancel}
          className="text-slate-500 hover:text-white text-sm underline cursor-pointer transition-colors"
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
