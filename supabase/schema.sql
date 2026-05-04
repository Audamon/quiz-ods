-- Salas de jogo multiplayer
create table if not exists game_sessions (
  id           uuid primary key default gen_random_uuid(),
  status       text not null default 'waiting',
  -- 'waiting'  → aguardando 2º jogador
  -- 'playing'  → partida em andamento
  -- 'finished' → partida encerrada
  player1_id   text not null,
  player2_id   text,
  questions    jsonb not null default '[]',
  current_question_index integer not null default 0,
  score_p1     integer not null default 0,
  score_p2     integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Respostas individuais de cada jogador por pergunta
create table if not exists game_answers (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references game_sessions(id) on delete cascade,
  player_id    text not null,
  question_index integer not null,
  answer_index integer not null,
  answered_at  timestamptz not null default now(),
  -- garante uma resposta por jogador por pergunta
  unique (session_id, player_id, question_index)
);

-- Habilita Realtime nas duas tabelas
alter publication supabase_realtime add table game_sessions;
alter publication supabase_realtime add table game_answers;
