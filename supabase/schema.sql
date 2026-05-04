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

-- Políticas RLS para game_sessions (acesso público anônimo)
alter table game_sessions enable row level security;

create policy "Qualquer um pode criar sessão"
  on game_sessions for insert
  to anon with check (true);

create policy "Qualquer um pode ver sessões"
  on game_sessions for select
  to anon using (true);

create policy "Qualquer um pode atualizar sessão"
  on game_sessions for update
  to anon using (true) with check (true);

-- Políticas RLS para game_answers (acesso público anônimo)
alter table game_answers enable row level security;

create policy "Qualquer um pode registrar resposta"
  on game_answers for insert
  to anon with check (true);

create policy "Qualquer um pode ver respostas"
  on game_answers for select
  to anon using (true);
