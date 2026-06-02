# 🃏 Quiz Master — Jogo de Cartas Digital sobre Culturas Regionais Brasileiras

Aplicação web interativa e educativa desenvolvida para promover o conhecimento sobre a diversidade cultural do Brasil por meio de mecânicas de jogo de cartas com perguntas e respostas.

---

## 📖 Sobre o Projeto

O **Quiz Master** é um jogo de cartas digital voltado ao ensino da diversidade cultural brasileira. A proposta alia gamificação e tecnologia para estimular o aprendizado sobre costumes, tradições, festas típicas, gírias e peculiaridades das cinco regiões do país.

O projeto está alinhado ao **ODS 4 – Educação de Qualidade**, democratizando o acesso ao conhecimento cultural por meio de dispositivos digitais, conforme a meta 4.4 da Agenda 2030 da ONU.

---

## ✨ Funcionalidades

- **Modo Um Jogador (banco local):** 18 perguntas curadas manualmente, cobrindo todas as regiões do Brasil
- **Modo Um Jogador com IA:** perguntas geradas dinamicamente via Google Gemini AI a cada partida
- **Modo Multijogador (em desenvolvimento):** partidas em tempo real entre dois jogadores via WebSocket
- Animações de flip de carta em 3D (Framer Motion)
- Feedback visual imediato por cores (verde/vermelho) ao responder
- Experiência sonora com música de fundo, som de flip e efeito whoosh
- Interface responsiva para celular, tablet e desktop

---

## 🛠️ Tecnologias

| Tecnologia           | Uso no projeto                                                                      |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Next.js**          | Framework principal (SSR + rotas de API)                                            |
| **TypeScript**       | Tipagem estática em todo o código                                                   |
| **Supabase**         | Banco de dados (PostgreSQL), autenticação e comunicação em tempo real via WebSocket |
| **Google Gemini AI** | Geração dinâmica de perguntas educativas                                            |
| **Framer Motion**    | Animações de interface (flip 3D, transições)                                        |
| **Tailwind CSS**     | Estilização responsiva com classes utilitárias                                      |

---

## 🏗️ Arquitetura

```
CLIENTE (Browser)
├── Menu component
├── Deck component
├── Lobby component
└── MultiplayerGame component
        │
        └── page.tsx (estado global)
                │
        HTTP / WebSocket
        ├── Next.js API Route (/api/questions)
        ├── Supabase (PostgreSQL + Realtime)
        └── Google Gemini AI (perguntas dinâmicas)
```

---

## 🎮 Modos de Jogo

### Um Jogador — Perguntas Locais

O jogador percorre as 18 questões do banco curado pela equipe, armazenado em `data/questions.json`. Ao final, a pontuação total é exibida com opção de jogar novamente.

### Um Jogador — Modo IA

A cada partida, 5 novas perguntas são geradas pela API do Google Gemini com base em um prompt educativo estruturado. Um sistema de cache no servidor evita chamadas duplicadas. Se a API estiver indisponível, o sistema faz fallback automático para o banco local.

### Multijogador

Dois jogadores são sincronizados em tempo real via Supabase. O matchmaking utiliza uma função RPC (`match_or_create_session`) para evitar condições de corrida. Vence o ponto quem responder corretamente primeiro. Um mecanismo de polling a cada 2 segundos garante a transição mesmo quando o WebSocket apresentar latência elevada.

---

## 🗄️ Banco de Dados (Supabase)

Duas tabelas principais:

**`game_sessions`**

- IDs dos jogadores
- Perguntas (JSONB)
- Índice da pergunta atual
- Placar de cada jogador
- Status da partida: `waiting` | `playing` | `finished`

**`game_answers`**

- ID da sessão
- ID do jogador
- Índice da pergunta e da resposta
- Timestamp
- Constraint de unicidade para evitar respostas duplicadas

---

## 🤖 Geração de Perguntas por IA

A rota `POST /api/questions` recebe o tema e o número do ODS, constrói um prompt educativo e envia ao modelo Gemini. O modelo retorna JSON puro com:

- 5 perguntas de múltipla escolha (4 alternativas cada)
- Índice da resposta correta
- Explicação cultural alinhada ao ODS 4

Um sistema de fallback em cascata tenta até 4 modelos (Gemini 3 Flash Preview → 2.5 Flash → 2.0 Flash → 2.0 Flash Lite) antes de recorrer ao banco local.

---

## 🔊 Experiência Sonora

- **Música de fundo** (chill-hop loop) com controle de mute no canto inferior direito
- **Som de flip** ao revelar a carta, com variação de playback rate
- **Som de whoosh** durante a animação de saída da carta

> O objeto `Audio` é inicializado somente após a primeira interação do usuário, contornando a política de bloqueio de autoplay dos navegadores modernos.

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse em `http://localhost:3000`.

---

## 📋 Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

---

## 🔭 Melhorias Futuras

- [ ] Expansão do banco de perguntas (cultura indígena, influências africanas, manifestações artísticas regionais)
- [ ] Sistema de pontuação persistente com ranking global via Supabase
- [ ] Modo Desafio Temático por região
- [ ] Suporte a leitores de tela e modo de alto contraste
- [ ] Internacionalização (inglês / espanhol)
- [ ] Suporte offline via Service Workers

---

## 📚 Referências

- ALVES, L.; MINHO, M. R. S.; DINIZ, M. V. C. **Gamificação: diálogos com a educação**. In: Gamificação na Educação. São Paulo: Pimenta Cultural, 2014.
- GOOGLE. **Google Gemini API Documentation**. Disponível em: https://ai.google.dev/docs
- IBGE. **Diversidade Cultural Brasileira**. Rio de Janeiro: IBGE, 2023.
- NEXT.JS. **Next.js Documentation**. Disponível em: https://nextjs.org/docs
- ONU. **Transformando Nosso Mundo: a Agenda 2030 para o Desenvolvimento Sustentável**. Nova York: ONU, 2015.
- SUPABASE. **Supabase Documentation**. Disponível em: https://supabase.com/docs
- TAROUCO, L. M. R. et al. **Jogos educacionais**. Novas Tecnologias na Educação, Porto Alegre, v. 2, n. 1, mar. 2004.
- VERCEL. **Framer Motion Documentation**. Disponível em: https://www.framer.com/motion

---

_Projeto desenvolvido para a disciplina de Fundamentos da Computação — FSG Centro Universitário, Caxias do Sul, 2026._
