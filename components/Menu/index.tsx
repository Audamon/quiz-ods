"use client";
import { motion } from "framer-motion";

interface MenuProps {
  onStartSinglePlayer: () => void;
  onSetGameType?: (type: "single" | "ai" | "multi") => void; // Opcional, para futuras expansões
}

export default function Menu({ onStartSinglePlayer, onSetGameType }: MenuProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-black text-blue-700 tracking-tight mb-2">
          QUIZ MASTER
        </h1>
        <p className="text-slate-500 font-medium">
          Desafie seu conhecimento técnico
        </p>
      </motion.div>
      <div className="flex flex-col w-full max-w-xs gap-4">
        {/* Botão Um Jogador */}
        <motion.button
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onStartSinglePlayer();
            if (onSetGameType) {
              onSetGameType("single");
            }
          }}
          className="group relative bg-white border-2 border-blue-600 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:cursor-pointer transition-all flex items-center justify-between"
        >
          <span className="text-xl font-bold text-blue-700">Um Jogador</span>
          <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
            👤
          </div>
        </motion.button>
        <div className="flex flex-col w-full max-w-xs gap-4">
        {/* Botão Um Jogador */}
        <motion.button
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onStartSinglePlayer();
            if (onSetGameType) {
              onSetGameType("ai");
            }
          }}
          className="group relative bg-white border-2 border-blue-600 p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(37,99,235,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] hover:cursor-pointer transition-all flex items-center justify-between"
        >
          <span className="text-xl font-bold text-blue-700">Um Jogador IA</span>
          <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
            👤
          </div>
        </motion.button>


        {/* Botão Multiplayer (Desabilitado por enquanto) */}
        <motion.button
          disabled
          className="opacity-50 grayscale cursor-not-allowed bg-slate-100 border-2 border-slate-300 p-5 rounded-2xl flex items-center justify-between"
        >
          <span className="text-xl font-bold text-slate-500">Multiplayer</span>
          <span className="text-xs font-bold bg-slate-300 text-slate-600 px-2 py-1 rounded">
            EM BREVE
          </span>
        </motion.button>
      </div>
    </div>
  );
}
