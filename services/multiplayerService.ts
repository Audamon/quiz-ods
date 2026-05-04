import { supabase } from "@/lib/supabase";
import { Question } from "@/specs/quiz";

export interface GameSession {
  id: string;
  status: "waiting" | "playing" | "finished";
  player1_id: string;
  player2_id: string | null;
  questions: Question[];
  current_question_index: number;
  score_p1: number;
  score_p2: number;
}

export interface GameAnswer {
  id: string;
  session_id: string;
  player_id: string;
  question_index: number;
  answer_index: number;
  answered_at: string;
}

// Gera um ID de jogador anônimo persistido na sessão do browser
export function getOrCreatePlayerId(): string {
  let id = sessionStorage.getItem("player_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("player_id", id);
  }
  return id;
}

// Procura sala em espera ou cria uma nova
export async function joinOrCreateSession(
  questions: Question[],
): Promise<GameSession> {
  const playerId = getOrCreatePlayerId();

  // Tenta entrar numa sala que está esperando
  const { data: waiting } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("status", "waiting")
    .is("player2_id", null)
    .neq("player1_id", playerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (waiting) {
    const { data: updated, error } = await supabase
      .from("game_sessions")
      .update({ player2_id: playerId, status: "playing" })
      .eq("id", waiting.id)
      .select()
      .single();

    if (error) throw error;
    return updated as GameSession;
  }

  // Nenhuma sala disponível — cria uma nova
  const { data: created, error } = await supabase
    .from("game_sessions")
    .insert({
      player1_id: playerId,
      questions,
      status: "waiting",
    })
    .select()
    .single();

  if (error) throw error;
  return created as GameSession;
}

// Registra a resposta do jogador para uma pergunta
export async function submitAnswer(
  sessionId: string,
  questionIndex: number,
  answerIndex: number,
): Promise<void> {
  const playerId = getOrCreatePlayerId();
  const { error } = await supabase.from("game_answers").insert({
    session_id: sessionId,
    player_id: playerId,
    question_index: questionIndex,
    answer_index: answerIndex,
  });
  // Ignora erro de unique constraint (resposta duplicada)
  if (error && !error.message.includes("unique")) throw error;
}

// Busca as respostas de uma pergunta específica
export async function getAnswersForQuestion(
  sessionId: string,
  questionIndex: number,
): Promise<GameAnswer[]> {
  const { data, error } = await supabase
    .from("game_answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("question_index", questionIndex)
    .order("answered_at", { ascending: true });

  if (error) throw error;
  return data as GameAnswer[];
}

// Avança para a próxima pergunta e atualiza placar
export async function advanceQuestion(
  session: GameSession,
  winnerPlayerId: string | null,
): Promise<void> {
  const isLast =
    session.current_question_index >= session.questions.length - 1;

  const scoreUpdate =
    winnerPlayerId === session.player1_id
      ? { score_p1: session.score_p1 + 1 }
      : winnerPlayerId === session.player2_id
        ? { score_p2: session.score_p2 + 1 }
        : {};

  await supabase
    .from("game_sessions")
    .update({
      ...scoreUpdate,
      current_question_index: isLast
        ? session.current_question_index
        : session.current_question_index + 1,
      status: isLast ? "finished" : "playing",
    })
    .eq("id", session.id);
}
