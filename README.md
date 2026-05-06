# MiniGame Platform — Финальный план

> Веб-портал классических мини-игр с одиночной игрой, соло-AI и асинхронным/turn-based мультиплеером. Собрано из 4 исходных файлов (`README.md`, `Plan.md`, «Анализ и дополнение мини-игр», «Подбор мини-игр для сайта») с учётом внешней критики и жёсткого ограничения **«только бесплатные тарифы»**.

---

## Оглавление

1. [Принципы и контекст](#1-принципы-и-контекст)
2. [Критика старого плана и решения](#2-критика-старого-плана-и-решения)
3. [Стек](#3-стек)
4. [Архитектурные паттерны под игры](#4-архитектурные-паттерны-под-игры)
5. [Структура проекта](#5-структура-проекта)
6. [Контракт игрового движка](#6-контракт-игрового-движка)
7. [База данных (миграции по фазам)](#7-база-данных-миграции-по-фазам)
8. [Авторизация и Account Linking](#8-авторизация-и-account-linking)
9. [Темы](#9-темы)
10. [PWA + Outbox / Sync Queue](#10-pwa--outbox--sync-queue)
11. [Cloudflare Workers — только keep-alive](#11-cloudflare-workers--только-keep-alive)
12. [Список игр и приоритеты](#12-список-игр-и-приоритеты)
13. [Подробности AI и алгоритмов](#13-подробности-ai-и-алгоритмов)
14. [Realtime quota guard для пинг-понга](#14-realtime-quota-guard-для-пинг-понга)
15. [Free-tier бюджет и риски](#15-free-tier-бюджет-и-риски)
16. [Окружение и переменные](#16-окружение-и-переменные)
17. [Production-чеклисты](#17-production-чеклисты)
18. [Фазы разработки](#18-фазы-разработки)
19. [Чеклист «Как добавить новую игру»](#19-чеклист-как-добавить-новую-игру)
20. [Post-MVP бэклог](#20-post-mvp-бэклог)
21. [Что выкинуто из исходных файлов и почему](#21-что-выкинуто-из-исходных-файлов-и-почему)

---

## 1. Принципы и контекст

1. **Качество > количество.** Судоку доводится до идеала **до** перехода к остальным играм.
2. **Только бесплатные тарифы.** Vercel Hobby, Supabase Free, Cloudflare Workers Free. Любая фича, которая в свободной квоте «упрётся в счёт» — отвергается или переезжает на клиент.
3. **MVP — только классика + соло-AI + лидерборды.** Никакого Roguelite-слоя, Battle Pass, Ghost Runs, DDA, экономики, мета-прогрессии — всё это в [§20 Post-MVP бэклог](#20-post-mvp-бэклог).
4. **Migrations-first.** БД расширяется миграциями по фазам, а не «всё сразу». Никаких мёртвых таблиц multiplayer на старте.
5. **Client-heavy архитектура.** Тяжёлые расчёты (минимакс, Stockfish, генерация уровней, физика) — **на клиенте**. Сервер (Supabase + один CF Worker для keep-alive) — только Auth, persist, лидерборды, lightweight realtime.
6. **Только русский язык.** Никаких i18n-каркасов и словарей переводов в коде. Всё хардкодом по-русски.

---

## 2. Критика старого плана и решения

| # | Проблема старого плана | Решение |
|---|---|---|
| 1 | Stockfish WASM в Cloudflare Workers → CPU timeout, $$$ | **Stockfish WASM на клиенте** в Web Worker. Сила регулируется глубиной/временем. CF Workers выкидываем из этой задачи. |
| 2 | Свой WebSocket-relay на Cloudflare Durable Objects дублирует Supabase Realtime | Используем **Supabase Realtime Presence + Broadcast**. Durable Objects не используются вообще. |
| 3 | `game_sessions` пишется при каждой партии, включая 5-секундные крестики-нолики → DDoS своей БД | **Микро-игры пишут только агрегаты в `leaderboard` (UPSERT по best)**. Детальные сессии — только для длинных игр (Sudoku, Sapper, Шахматы). Для middle-игр — JSONB-массив последних N сессий в `profiles.recent_results`. |
| 4 | PWA «оффлайн» + `endSession()` возвращает Promise → потеря прогресса | **Outbox-паттерн в IndexedDB**. Все мутации идут в локальную очередь, фоновый Sync Worker дренирует её в Supabase при наличии сети (Background Sync API + fallback на `online` event + 30-секундный таймер). |
| 5 | Гость → Google = ghost data | **Account Linking** через `supabase.auth.linkIdentity()`. Если миграция нужна постфактум — RPC `merge_guest_into_user(guest_id, target_id)` с переносом `leaderboard`/`game_sessions`. |
| 6 | Таблицы `rooms`, `room_players` создаются в Phase 0, хотя multiplayer — Phase 4 | **БД мигрируется по фазам.** Phase 0 = `profiles`, `games`, `leaderboard`, `user_settings`. Sessions/achievements — Phase 1. Rooms — Phase 4. |

---

## 3. Стек

| Слой | Технология | Free tier | Зачем |
|---|---|---|---|
| Хостинг фронта | **Vercel Hobby** | 100 GB bw, 10 s function timeout | Next.js-нативный CI/CD, Preview Deployments |
| Фреймворк | **Next.js 14+ (App Router)** | — | RSC, SSG/SSR, layouts, edge runtime |
| UI | React + TypeScript + Tailwind + Shadcn UI | — | Доступность из коробки, скорость разработки |
| Состояние | Zustand | — | Лёгкий, без boilerplate, поддержка persist |
| BaaS | **Supabase Free** | 500 MB БД, 1 GB storage, 50k MAU, 200 concurrent Realtime, 2M Realtime msg/мес, 500k Edge Function invocations, ⚠️ пауза проекта при 7 днях бездействия | Auth + Postgres + Realtime + RLS + Edge Functions |
| Edge | **Cloudflare Workers Free — только cron keep-alive** | Scheduled triggers + 100k req/день | Один Worker на весь проект: cron раз в 6 дней пингует Supabase, чтобы проект не уснул. **Ничего больше.** |
| Шахматный движок | **Stockfish WASM (sf16 NNUE) в Web Worker** | — | Оффлайн, бесплатно, ELO регулируется глубиной/`Skill Level` |
| Шашечный/реверси/гомоку AI | минимакс + α-β + iterative deepening на клиенте (TS) | — | Один файл движка на игру, оффлайн |
| PWA | Service Worker (Workbox) + IndexedDB | — | Оффлайн-режим для соло-игр + Outbox |

---

## 4. Архитектурные паттерны под игры

| Паттерн | Описание | Применение в проекте |
|---|---|---|
| **A. Pure client (Vanilla TS / Canvas / PWA)** | Вся логика, рендер и AI — в браузере локально | Sudoku, Sapper, 2048, Snake, Hangman, Wordle, Memory, Pong-vs-AI |
| **B. Client WebAssembly** | Тяжёлый движок (C++/Rust) → WASM, в браузере, в Web Worker | **Шахматы (Stockfish)** |
| **C. Lock-step через Supabase Realtime** | Состояние комнаты в JSONB, ходы транслируются Broadcast/Presence; валидация на клиенте, конфликт-резолв на сервере (RPC) | Tic-Tac-Toe, 4-в-ряд, Морской бой |
| **D. Host-authoritative через Realtime** | Один игрок (host) — авторитет физики, шлёт state ~15–20 Hz Broadcast'ом | Пинг-понг (с жёстким quota guard, [§14](#14-realtime-quota-guard-для-пинг-понга)) |
| ~~E. Cloud LLM API~~ | Не используется в MVP вообще | бэклог |

---

## 5. Структура проекта

```
minigame/
├── app/                              # Next.js App Router
│   ├── (auth)/login/page.tsx
│   ├── (auth)/callback/route.ts
│   ├── (games)/
│   │   ├── layout.tsx                # Общий шелл игры (header, pause, leaderboard)
│   │   ├── sudoku/page.tsx
│   │   ├── minesweeper/page.tsx
│   │   ├── 2048/page.tsx
│   │   └── ...
│   ├── profile/page.tsx
│   ├── leaderboard/page.tsx
│   ├── manifest.ts                   # PWA manifest
│   ├── layout.tsx
│   └── page.tsx                      # Главная (GameGrid)
│
├── components/
│   ├── ui/                           # Shadcn
│   ├── layout/{Header,Footer,ThemeToggle}.tsx
│   ├── auth/{GoogleOneTap,AuthModal,UserMenu}.tsx
│   ├── games/{GameCard,GameGrid,QuotaGuard}.tsx
│   └── shared/{Timer,ScoreBoard,DifficultySelector}.tsx
│
├── games/                            # Чистая логика, без React/Supabase
│   ├── registry.ts                   # Централизованный реестр (см. §6)
│   ├── _lib/
│   │   ├── prng.ts                   # Seedable PRNG (mulberry32)
│   │   ├── solver-base.ts
│   │   └── types.ts                  # GameEngine<State, Action>
│   ├── sudoku/{engine,solver,generator,types,constants,hooks}.ts
│   ├── minesweeper/...
│   ├── chess/
│   │   ├── engine.ts                 # Глюэ-обёртка над Stockfish
│   │   └── stockfish.worker.ts       # Web Worker
│   └── ...
│
├── stores/{authStore,themeStore,gameStore,settingsStore}.ts
│
├── lib/
│   ├── supabase/{client,server,types,middleware-helpers}.ts
│   ├── outbox/                       # Sync Queue (см. §10)
│   │   ├── db.ts                     # IndexedDB-обёртка (idb)
│   │   ├── enqueue.ts
│   │   ├── drain.ts                  # Фоновая синхронизация
│   │   └── handlers/{leaderboard,session,achievement}.ts
│   ├── realtime/{quota-guard.ts}     # Защита квоты пинг-понга (§14)
│   └── pwa/{register-sw.ts,sync.ts}
│
├── public/
│   ├── sw.js                         # Workbox-сборка
│   └── stockfish/                    # WASM-бинарник (~ 1 MB) lazy-загрузка
│
├── styles/{globals.css,themes/{light,dark}.css}
│
├── supabase/
│   ├── migrations/                   # Phase 0..N (см. §7)
│   ├── functions/                    # Edge Functions (если нужны)
│   └── seed.sql
│
├── workers/
│   └── keep-alive/                   # Единственный CF Worker (§11)
│       ├── src/index.ts
│       └── wrangler.toml
│
├── types/{game,user,db}.ts
├── middleware.ts
├── next.config.ts
└── tailwind.config.ts
```

---

## 6. Контракт игрового движка

```ts
// games/_lib/types.ts
export interface GameEngine<State, Action, Options = unknown> {
  createInitialState(opts: Options, seed?: number): State;
  applyAction(state: State, action: Action): State;
  isValidAction(state: State, action: Action): boolean;
  isGameOver(state: State): boolean;
  getScore(state: State): number;
  /** для мультиплеера: детерминированный хеш состояния — для верификации */
  hashState?(state: State): string;
}
```

Любая игра реализует этот интерфейс **в чистом TS**, без React/Supabase. UI и сетевой слой подключаются хуком `use<Name>()`.

**Реестр игр (`games/registry.ts`):**

```ts
export type GameCategory = 'logic' | 'arcade' | 'word' | 'board' | 'card';
export type ArchPattern = 'A' | 'B' | 'C' | 'D';

export interface GameMeta {
  id: string;
  name: string;            // только русский
  icon: string;
  category: GameCategory;
  path: string;
  difficulties: string[];
  isMultiplayer: boolean;
  pattern: ArchPattern;
  persistsSessions: boolean;   // ★ true → пишем в game_sessions; false → только leaderboard / recent_results
  isActive: boolean;
}

export const GAME_REGISTRY: GameMeta[] = [
  { id: 'sudoku', name: 'Судоку', icon: '🔢', category: 'logic',
    path: '/sudoku', difficulties: ['easy','medium','hard','expert'],
    isMultiplayer: false, pattern: 'A', persistsSessions: true, isActive: true },
  // ...
];
```

`GameCard` на главной строится из этого реестра — добавление игры = одна запись + папка `games/<id>/`.

---

## 7. База данных (миграции по фазам)

### Phase 0 — `0000_init.sql`

```sql
-- Профили
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  recent_results JSONB DEFAULT '[]'::jsonb,  -- ring-buffer на 50 последних результатов микро-игр
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Каталог игр (мирроринг registry.ts; используется для админки и server-side фильтров)
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  is_multiplayer BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- Лидерборд (агрегаты, UPSERT)
CREATE TABLE leaderboard (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id),
  difficulty TEXT NOT NULL,
  best_time_seconds INT,
  best_score INT,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, game_id, difficulty)
);

-- Настройки (без поля language — у нас только русский)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  sound_enabled BOOLEAN DEFAULT TRUE,
  animations_enabled BOOLEAN DEFAULT TRUE,
  extra JSONB DEFAULT '{}'
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles read all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles write own" ON profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard read all" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "leaderboard write own" ON leaderboard FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings own" ON user_settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC: атомарный апсерт лидерборда (LWW по best_time, MWW по best_score)
CREATE OR REPLACE FUNCTION upsert_leaderboard(
  p_game_id TEXT, p_difficulty TEXT,
  p_time INT, p_score INT, p_won BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO leaderboard (user_id, game_id, difficulty,
                           best_time_seconds, best_score,
                           games_played, games_won)
  VALUES (auth.uid(), p_game_id, p_difficulty, p_time, p_score,
          1, CASE WHEN p_won THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, game_id, difficulty) DO UPDATE SET
    best_time_seconds = LEAST(COALESCE(leaderboard.best_time_seconds, 999999), EXCLUDED.best_time_seconds),
    best_score        = GREATEST(COALESCE(leaderboard.best_score, 0), EXCLUDED.best_score),
    games_played      = leaderboard.games_played + 1,
    games_won         = leaderboard.games_won + CASE WHEN p_won THEN 1 ELSE 0 END,
    updated_at        = NOW();
END $$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 1 — `0001_sudoku.sql`

```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_uuid UUID UNIQUE,                       -- идемпотентность Outbox
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  game_id TEXT REFERENCES games(id),
  difficulty TEXT,
  status TEXT DEFAULT 'active',
  score INT,
  duration_seconds INT,
  moves INT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
-- ⚠️ Пишем сюда только для игр с registry.persistsSessions = true (Sudoku, Sapper, Chess).

CREATE INDEX idx_sessions_user_game ON game_sessions(user_id, game_id, started_at DESC);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions own" ON game_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TTL: автоматическое удаление сессий старше 90 дней (pg_cron)
SELECT cron.schedule('purge_old_sessions', '0 3 * * *',
  $$DELETE FROM game_sessions WHERE finished_at < NOW() - INTERVAL '90 days'$$);

CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  condition JSONB
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach read all"  ON user_achievements FOR SELECT USING (true);
CREATE POLICY "ach write own" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPC слияния гостевого аккаунта в авторизованный
CREATE OR REPLACE FUNCTION merge_guest_into_user(p_guest_id UUID)
RETURNS VOID AS $$
BEGIN
  IF p_guest_id = auth.uid() THEN RETURN; END IF;

  -- Лидерборд: переносим записи гостя, разрешая конфликты «лучшим» значением
  INSERT INTO leaderboard AS dst (user_id, game_id, difficulty,
                                  best_time_seconds, best_score,
                                  games_played, games_won)
  SELECT auth.uid(), game_id, difficulty,
         best_time_seconds, best_score, games_played, games_won
  FROM leaderboard WHERE user_id = p_guest_id
  ON CONFLICT (user_id, game_id, difficulty) DO UPDATE SET
    best_time_seconds = LEAST(dst.best_time_seconds, EXCLUDED.best_time_seconds),
    best_score        = GREATEST(dst.best_score, EXCLUDED.best_score),
    games_played      = dst.games_played + EXCLUDED.games_played,
    games_won         = dst.games_won + EXCLUDED.games_won;

  UPDATE game_sessions SET user_id = auth.uid() WHERE user_id = p_guest_id;

  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT auth.uid(), achievement_id, earned_at
  FROM user_achievements WHERE user_id = p_guest_id
  ON CONFLICT DO NOTHING;

  DELETE FROM leaderboard       WHERE user_id = p_guest_id;
  DELETE FROM user_achievements WHERE user_id = p_guest_id;
  DELETE FROM profiles          WHERE id = p_guest_id AND is_guest = TRUE;
END $$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Phase 4 — `0004_multiplayer.sql` (только когда дойдём до multiplayer)

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES games(id),
  host_id UUID REFERENCES profiles(id),
  code TEXT UNIQUE,                    -- 6-значный код
  status TEXT DEFAULT 'waiting',
  max_players INT DEFAULT 2,
  state JSONB DEFAULT '{}',            -- canonical state
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 hours'
);
SELECT cron.schedule('purge_expired_rooms', '*/15 * * * *',
  $$DELETE FROM rooms WHERE expires_at < NOW()$$);

CREATE TABLE room_players (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seat INT, is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- RLS: видит комнату только её участник; писать state может только host (через RPC apply_move).
```

### Phase 5 — `0005_realtime_quota.sql` (для пинг-понга, см. §14)

```sql
CREATE TABLE realtime_usage (
  month DATE PRIMARY KEY,           -- первый день месяца
  estimated_messages BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Атомарный инкремент. Возвращает новое значение для клиентской логики quota guard.
CREATE OR REPLACE FUNCTION increment_realtime_usage(p_count BIGINT)
RETURNS BIGINT AS $$
DECLARE v_new BIGINT;
BEGIN
  INSERT INTO realtime_usage (month, estimated_messages)
  VALUES (date_trunc('month', NOW())::DATE, p_count)
  ON CONFLICT (month) DO UPDATE SET
    estimated_messages = realtime_usage.estimated_messages + EXCLUDED.estimated_messages,
    updated_at = NOW()
  RETURNING estimated_messages INTO v_new;
  RETURN v_new;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_realtime_usage_pct()
RETURNS NUMERIC AS $$
  SELECT COALESCE(estimated_messages::NUMERIC / 2000000, 0)
  FROM realtime_usage WHERE month = date_trunc('month', NOW())::DATE
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

---

## 8. Авторизация и Account Linking

| Метод | Реализация | Приоритет |
|---|---|---|
| Google One Tap | `supabase.auth.signInWithIdToken({ provider: 'google', token: <onetap_credential> })` | ⭐ главный |
| Google (кнопка) | `supabase.auth.signInWithOAuth({ provider: 'google' })` | резерв |
| Email + Password | `signUp` / `signInWithPassword` | ✅ |
| Magic Link | `signInWithOtp` | ✅ |
| Гость | `signInAnonymously()` (флаг `is_guest = TRUE` в `profiles`) | ✅ |

### Account linking flow (исправление критики §1, пункт 5)

```
┌─ Гость зашёл, наиграл прогресс
│
├─ Жмёт «Войти через Google»
│   ├─ Если supabase-js поддерживает linkIdentity:
│   │     await supabase.auth.linkIdentity({ provider: 'google' })
│   │     → user_id остаётся, идентичность добавляется → данные сохраняются
│   │     → снимаем флаг is_guest
│   │
│   └─ Если linkIdentity недоступен / упал:
│         сохранить guest_id локально → signOut() → signInWithOAuth()
│         → после возврата в /auth/callback клиент вызывает rpc('merge_guest_into_user', { p_guest_id: guest_id })
│         → старый guest profile удаляется RPC
```

**Важно:** регистрация почтой/паролем поверх гостевой сессии — приоритет `linkIdentity({ email, password })`, не `signUp`.

---

## 9. Темы

CSS Custom Properties на `<html data-theme>`, persist в `localStorage` через Zustand. Темы `light` (дефолт), `dark`. Добавление темы = `styles/themes/<name>.css` + ключ в `themeStore` + кнопка в `ThemeToggle`.

```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #1a1a1a;
  --accent: #3b82f6;
  /* ... */
}
[data-theme="dark"] {
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --text-primary: #fafafa;
  --accent: #60a5fa;
}
```

---

## 10. PWA + Outbox / Sync Queue

### Service Worker (Workbox)
- Pre-cache: shell, шрифты, движки игр (lazy chunks). Stockfish WASM — по запросу при заходе в `/chess`, потом кэшируется навсегда.
- Runtime cache: `staleWhileRevalidate` для статики, `networkFirst` для `/api/*` с fallback в IndexedDB.

### Outbox в IndexedDB

```ts
// lib/outbox/types.ts
type Mutation =
  | { type: 'leaderboard.upsert'; payload: { gameId; difficulty; time; score; won } }
  | { type: 'session.finish';     payload: { sessionId; ... } }
  | { type: 'achievement.grant';  payload: { achievementId } };

interface OutboxItem {
  id: string;                 // UUID, генерируется на клиенте → используется как client_uuid в БД
  mutation: Mutation;
  createdAt: number;
  retries: number;
  lastError?: string;
}
```

### Поток

1. Игра завершена → `enqueue(mutation)` пишет в IDB store `outbox`.
2. UI обновляется оптимистично из локального стейта (Zustand).
3. `drain()` запускается:
   - сразу после enqueue, если `navigator.onLine`,
   - на событие `online`,
   - на Background Sync (`sw.registration.sync.register('outbox-drain')`),
   - таймером каждые 30 с (для Safari/iOS, где Background Sync ненадёжен).
4. `drain()` вызывает соответствующие RPC Supabase (`upsert_leaderboard`, `INSERT ... ON CONFLICT (client_uuid)`, и т.п.). Успех → удаление из IDB.
5. Ошибка → `retries++`, exponential backoff (max 6 попыток, потом помечаем `dead`, показываем пользователю в `/profile/sync-issues`).

### Идемпотентность

- Все RPC принимают `client_uuid` (из mutation.id), чтобы повторная отправка не дублировала запись в `game_sessions` / `user_achievements`.
- `upsert_leaderboard` уже атомарен и корректен (берёт `LEAST` по времени / `GREATEST` по очкам), порядок применения не важен — это специально подобранный кейс, чтобы не тащить CRDT. Для лидерборда LWW не теряет данных.

---

## 11. Cloudflare Workers — только keep-alive

В MVP используется **ровно один Cloudflare Worker** — для предотвращения автопаузы Supabase Free (через 7 дней бездействия проект усыпляется). Никаких других CF Workers не создаём.

```toml
# workers/keep-alive/wrangler.toml
name = "minigame-keepalive"
main = "src/index.ts"
compatibility_date = "2026-01-01"

[triggers]
crons = ["0 8 */6 * *"]  # каждые 6 дней в 08:00 UTC
```

```ts
// workers/keep-alive/src/index.ts
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    // Лёгкий запрос к публичному endpoint — этого достаточно, чтобы Supabase
    // считал проект активным и не отправлял в pause.
    await fetch(`${env.SUPABASE_URL}/rest/v1/games?select=id&limit=1`, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    });
  },
};
```

Бюджет: ~5 запусков в месяц = ~150 в год. Лимит CF Free = 100k req/день. Запас огромный.

> Если когда-нибудь окажется, что одного запроса мало, добавим ещё один к `auth/v1/health`. Если когда-нибудь Supabase раздаст keep-alive из коробки — Worker удалим. Никаких других задач Worker не получает.

---

## 12. Список игр и приоритеты

> Колонка **Pattern** ссылается на [§4](#4-архитектурные-паттерны-под-игры).

### Phase 1 — главная: Судоку

| Аспект | Решение |
|---|---|
| Pattern | A (pure client) |
| Генератор | «От обратного»: solved grid → удаляем клетки → проверяем солвером единственность решения. Алгоритм X (Dancing Links) или backtracking + arc-consistency. |
| Solver | Backtracking + naked/hidden singles + pointing pairs. Используется и для подсказок (next-step hint). |
| Сложности | Easy / Medium / Hard / Expert — по числу подсказок и набору техник, требуемых для решения |
| UI | 9×9 grid, цифровая клавиатура, заметки (карандаш), undo/redo, таймер, счётчик ошибок, пауза |
| Persist | `game_sessions` + `leaderboard` (по difficulty) + `user_achievements` |
| Достижения | Первое решение, без ошибок, < N мин по уровню сложности, серия из 5 без ошибок |

### Phase 2 — соло-аркады/головоломки

| Игра | Pattern | AI / генерация | Что пишем в БД |
|---|---|---|---|
| Сапёр | A | Безопасный первый клик; Гауссово исключение для подсказки вероятностей | `game_sessions` + `leaderboard` |
| 2048 | A | Seedable PRNG для появления плиток | `leaderboard` (max score) |
| Змейка | A | Опц. бот: A* + Hamilton цикл для self-play демо | `leaderboard` (max score) |
| Виселица | A | Корпус слов из public-domain словарей | `leaderboard` (winrate) |
| Wordle-клон | A | Корпус 5-буквенных слов; ежедневное слово синхронно для всех (по UTC дате на клиенте, без бэкенда) | `leaderboard` (streak) |
| Найди пару | A | Перемешивание seedable PRNG | `leaderboard` (best time) |

### Phase 3 — соло AI (классический минимакс / WASM)

| Игра | Pattern | AI |
|---|---|---|
| Крестики-нолики (vs AI) | A | Полный перебор (минимакс), идеальная игра |
| 4-в-ряд (vs AI) | A | Минимакс + α-β по столбцам, глубина 7–9 |
| Реверси (vs AI) | A | Минимакс + α-β + угловая эвристика + штраф C-square + iterative deepening (1–3 с) |
| Шашки (vs AI) | A | Минимакс + α-β + iterative deepening + transposition table |
| Шахматы (vs AI) | **B** | **Stockfish 16 NNUE WASM** в Web Worker. Сила: уровень 0–20 (`Skill Level` UCI option) или фиксированная глубина. WASM ленится-грузится при заходе в `/chess`. |

### Phase 4 — turn-based мультиплеер

| Игра | Pattern | Realtime |
|---|---|---|
| Крестики-нолики онлайн | C | Broadcast по `room:{id}`; state в `rooms.state` JSONB |
| 4-в-ряд онлайн | C | То же |
| Морской бой | C | Расстановка скрыта (хранится локально и копия — на хосте); ходы/попадания транслируются broadcast'ом |

### Phase 5 — real-time мультиплеер

| Игра | Pattern | Realtime | Защита |
|---|---|---|---|
| Пинг-понг | D (host-authoritative) | Broadcast 15 Hz | **Quota Guard, см. [§14](#14-realtime-quota-guard-для-пинг-понга)** |

### Игр в MVP — нет

- Tetris (тяжёлая логика, не было в исходном списке)
- Маджонг, Дурак, Блэкджек, AI Dungeon — в [§20 Post-MVP бэклог](#20-post-mvp-бэклог)
- Никаких Roguelite-вариантов классических игр в MVP

---

## 13. Подробности AI и алгоритмов

| Игра | Алгоритм | Регулировка сложности |
|---|---|---|
| Tic-Tac-Toe | Полный минимакс | случайный «глупый» ход с вероятностью p |
| Connect 4 | Минимакс + α-β по столбцам | глубина 3 / 5 / 7 / 9 |
| Reversi | Минимакс + α-β + позиционные веса (углы +100, C-squares −50) + mobility | глубина / время поиска |
| Шашки | Минимакс + α-β + iterative deepening + transposition table | время поиска |
| Шахматы | **Stockfish WASM** | UCI `Skill Level` 0–20 |
| Морской бой | 3 уровня: Random → Hunt+Target → Hunt+Parity → Probability Density Function | переключение режима |
| Sudoku | Backtracking + Algorithm X / Dancing Links (Knuth) | количество техник, требуемых для решения |
| Sapper | Probabilistic deduction (Гауссово исключение для границ — для подсказок) | размер поля + плотность мин |
| Snake (бот) | A* + Hamilton cycle | — (только для авто-демо) |
| Pong AI | Tracking ball y + injected error/lag | макс. скорость ракетки |

---

## 14. Realtime quota guard для пинг-понга

Лимит Supabase Free: **2M Realtime сообщений в месяц**. Один матч пинг-понга при 15 Hz × 60 с × 2 направления ≈ 1800 сообщений. Это даёт ≈ **1100 матчей в месяц** на бесплатной квоте.

### Реализация защиты

1. **Учёт.** В Phase 5 заводим таблицу `realtime_usage` (см. [§7 Phase 5](#7-база-данных-миграции-по-фазам)). После каждого завершённого матча хост вызывает `rpc('increment_realtime_usage', { p_count: <отправлено сообщений> })`. Хост считает локально (счётчик `channel.send` вызовов).
2. **Проверка перед матчем.** При заходе на главную / в `/pong` клиент дёргает `rpc('get_realtime_usage_pct')`.
3. **Поведение:**
   - `pct < 0.80` — пинг-понг отображается как обычно.
   - `0.80 ≤ pct < 0.95` — пинг-понг отображается, но карточка показывает баннер «Сервер близок к ежемесячному лимиту, возможны задержки».
   - `pct ≥ 0.95` — карточка пинг-понга **скрывается** из `GameGrid` (`isActive = false` принудительно), на странице `/pong` — заглушка «Пинг-понг временно недоступен. Попробуйте 1-го числа следующего месяца».
4. **Сброс.** На 1-е число месяца — Supabase pg_cron job:

```sql
SELECT cron.schedule('reset_realtime_usage', '0 0 1 * *',
  $$INSERT INTO realtime_usage (month, estimated_messages)
    VALUES (date_trunc('month', NOW())::DATE, 0)
    ON CONFLICT DO NOTHING$$);
```

5. **Доп. защита.** Жёсткий cap на стороне клиента: max 2 одновременных активных матча на весь сайт (через Realtime Presence на канале `pong:lobby`); если превышено — кнопка «Найти соперника» дизейблится с сообщением «Сейчас идут другие матчи, подождите минуту».

> Дополнительно: частоту broadcast'а в режиме «мяч медленно катится» можно временно понижать до 8 Hz, что даёт ещё ~2x экономии. Реализуется в host-loop.

---

## 15. Free-tier бюджет и риски

### Supabase Free
- **500 MB БД.** За счёт того, что микро-сессии не пишутся в `game_sessions`, а `recent_results` — ring-buffer на 50 записей, реалистичный объём за год при 10k пользователей ≪ 200 MB.
- **200 concurrent Realtime.** На MVP — потолок ~100 одновременных turn-based матчей. Достаточно.
- **2M Realtime msg/мес.** См. [§14](#14-realtime-quota-guard-для-пинг-понга) — есть жёсткий guard.
- **Пауза проекта при 7 днях бездействия.** Один CF Worker с cron-триггером раз в 6 дней ([§11](#11-cloudflare-workers--только-keep-alive)).

### Vercel Hobby
- **10 s function timeout.** Все RSC/Edge handlers — лёгкие. Тяжёлая работа (Stockfish, минимакс, генератор Sudoku) — на клиенте.
- **100 GB bw / мес.** Stockfish WASM (~1 MB) lazy-грузится только при заходе в `/chess` и кэшируется навсегда. Реальный bw на пользователя — < 5 MB при первом заходе, < 200 KB на возврат. ~ 20k уникальных пользователей в месяц укладываются.

### Cloudflare Workers Free
- 100k req/день. Используем ~5 запусков в месяц. Запас бесконечный.

### Точки отказа и митигация
1. **Превышение Supabase Realtime msg** → пинг-понг скрывается ([§14](#14-realtime-quota-guard-для-пинг-понга)).
2. **Превышение Supabase БД 500 MB** → принудительный TTL в `game_sessions` (90 дней, pg_cron) и `recent_results` (50 записей max).
3. **Vercel build minutes** → следить за preview-деплоями, не плодить лишних PR.

---

## 16. Окружение и переменные

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # только в server actions / migrations / CI

# Google One Tap
NEXT_PUBLIC_GOOGLE_CLIENT_ID=

# CF Worker keep-alive (отдельный wrangler.toml secrets)
# Эти переменные задаются ТОЛЬКО в окружении CF Worker, не в Vercel
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
```

---

## 17. Production-чеклисты

### Производительность
| Принцип | Реализация |
|---|---|
| Code splitting | `dynamic import()` каждого движка игры |
| Оптимистичные обновления | Zustand локально, Supabase в фоне через Outbox |
| Offline | PWA + Service Worker + IDB Outbox ([§10](#10-pwa--outbox--sync-queue)) |
| Анимации | Framer Motion + Tailwind transitions |
| Доступность | ARIA, фокус-ловушки, полная клавиатура, контраст AA+ |
| Lighthouse | PWA ≥ 90, A11y ≥ 95, Performance ≥ 90 на мобильном |

### Тесты
- **Vitest** — для движков (`engine.spec.ts`, `solver.spec.ts`, `generator.spec.ts`).
- **Playwright** — E2E для главной + `/sudoku` + Auth flow + Account Linking.
- **CI** — GitHub Actions: lint + typecheck + Vitest на каждый PR; Playwright только на main/release.

### Lint / typecheck
- `eslint` (next/core-web-vitals + recommended) + `prettier` (через eslint-plugin).
- `tsc --noEmit` обязательным шагом в CI.

---

## 18. Фазы разработки

| Фаза | Срок (грубо) | Что | Definition of Done |
|---|---|---|---|
| 0. Инфра | 1 нед | Next.js, Tailwind+Shadcn, Supabase проект, Vercel deploy, миграция `0000_init`, темы, Auth (Google OneTap + Email + Magic + Guest), Account Linking, главная с GameGrid из registry, PWA shell, Outbox-каркас, CF Worker keep-alive | Залогиниться, переключить тему, увидеть пустую главную и `/sudoku` placeholder, Lighthouse PWA ≥ 80 |
| 1. Sudoku | 2–3 нед | Полный движок, генератор+солвер, UI, лидерборд, достижения, миграция `0001_sudoku`, Outbox-handlers, тесты | Sudoku в офлайне работает, лидерборд синкается онлайн, Lighthouse PWA ≥ 90 |
| 2. Соло-аркады | 2 нед | Сапёр, 2048, Змейка, Виселица, Wordle, Найди пару | Все играются офлайн, лидерборды |
| 3. Соло AI | 1–2 нед | Крестики-нолики vs AI, 4-в-ряд vs AI, Реверси vs AI, Шашки vs AI |
| 4. Шахматы | 1 нед | Stockfish WASM Web Worker, lazy load, регулировка силы, кэширование WASM в Service Worker | Играется офлайн (после первой загрузки WASM) |
| 5. MP turn-based | 2 нед | Realtime room, лобби, миграция `0004_multiplayer`, Tic-Tac-Toe / 4-в-ряд / Морской бой онлайн | Двое в разных вкладках играют |
| 6. Пинг-понг RT | 1 нед | Host-authoritative + миграция `0005_realtime_quota` + Quota Guard | Двое играют 60 с, quota guard работает (тестируем подменой `get_realtime_usage_pct` → 0.96 → пинг-понг скрывается) |
| 7. Полировка | ∞ | Достижения, A11y, Lighthouse, Web Vitals на мобильных |

---

## 19. Чеклист «Как добавить новую игру»

1. Создать `games/<id>/` (engine.ts, types.ts, hooks/use<Name>.ts).
2. Покрыть тестами движок (Vitest).
3. Добавить запись в `games/registry.ts` + миграцию `INSERT INTO games(...)`.
4. Создать `app/(games)/<id>/page.tsx` с динамическим импортом движка.
5. Если `persistsSessions: true` — миграция БД (или просто пишем в `recent_results` JSONB profiles).
6. Если есть AI-пасс — добавить `worker.ts` или модуль `ai/`.
7. Lighthouse + Playwright smoke test.

---

## 20. Post-MVP бэклог

> Эти идеи **не идут в MVP**. Хранятся как опция, обсуждаются ТОЛЬКО после того, как все MVP-фазы (0–7) завершены и стабильны.

| Тема | Источник | Когда |
|---|---|---|
| Roguelite Snake (auto-battler) | analysis1 | После MVP, если будет аудитория |
| Roguelite Sapper (dungeon, HP/инвентарь) | analysis1 | То же |
| Sudoku Overhaul (action-Sudoku) | analysis1 | Эксперимент |
| Achievements + daily streak + missions (мета-прогрессия) | analysis1 | После MVP |
| Battle Pass / экономика / монетизация | analysis1 | Только если выйдем на устойчивые DAU > 1k |
| Ghost Runs (replays в JSONB) | analysis1 | Phase 8 |
| Supabase Realtime Presence для друзей / soc-фид | analysis1 | Phase 8 |
| DDA (динамическая сложность по winrate) | analysis1 | Phase 8 |
| CRDT / RxDB / PowerSync | analysis1 | Только если LWW в [§10](#10-pwa--outbox--sync-queue) перестанет хватать |
| LLM-quest (AI Dungeon, паттерн E) | analysis2 | Не на free tier |
| Tetris | analysis2 | После MVP |
| Маджонг, Дурак (multiplayer), Блэкджек, Уно, Солитер | analysis2 | После MVP |

---

## 21. Что выкинуто из исходных файлов и почему

| Источник | Что | Почему |
|---|---|---|
| `Plan.md` | `chess-engine` Worker | Stockfish переехал на клиент в Web Worker |
| `Plan.md` | `websocket-relay` Worker / Durable Objects | Supabase Realtime закрывает потребность |
| `Plan.md` | `rooms`, `room_players` в Phase 0 | Перенесены в миграцию Phase 4 |
| `Plan.md` | `game_sessions` для всех игр | Только для длинных игр; для остальных — `leaderboard` + `recent_results` |
| `Plan.md` | «Offline: PWA» одним пунктом | Расширено до полноценного Outbox-паттерна ([§10](#10-pwa--outbox--sync-queue)) |
| `Plan.md` | `language` в `user_settings` | Удалено — у нас только русский |
| `Plan.md` | CF Workers для OG, rate-limit, валидации, прокси | Оставлен только keep-alive Worker ([§11](#11-cloudflare-workers--только-keep-alive)) |
| analysis1 | Battle Pass, экономика, Roguelite-механики, мета-прогрессия | В бэклог [§20](#20-post-mvp-бэклог) — противоречит MVP-фокусу |
| analysis1 | CRDT / PowerSync / RxDB | В бэклог; на MVP LWW в Outbox достаточно |
| analysis1 | Ghost Runs (replays), DDA | В бэклог |
| analysis2 | LLM AI Dungeon | В бэклог; не free-tier-совместимо |
| analysis2 | Tetris, Маджонг, Дурак, Блэкджек, Уно, Солитер | В бэклог; не было в исходном списке `README` |
| Все источники | i18n / локализация | Удалено — только русский, без каркаса переводов |
