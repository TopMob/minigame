# 🎮 MiniGame Platform — Implementation Plan

> **Принцип:** Сначала — качество, потом — количество. Каждая игра доводится до идеала перед переходом к следующей.

---

## 📐 1. Технологический стек

| Слой | Технология | Причина выбора |
|---|---|---|
| Хостинг | **Vercel** | Edge-функции, zero-config CI/CD, превью-деплои |
| Фреймворк | **Next.js 14+ (App Router)** | SSR/SSG, layouts, server components |
| UI | **React + TypeScript** | Типобезопасность, переиспользуемые компоненты |
| Стили | **Tailwind CSS + Shadcn UI** | Утилиты + готовые доступные компоненты |
| Состояние | **Zustand** | Лёгкий, без бойлерплейта, персистентность |
| База данных | **Supabase** | Auth + PostgreSQL + Realtime + RLS |
| Тяжёлая логика | **Cloudflare Workers** | Проксирование, rate-limit, шахматный движок |
| Типизация БД | **supabase-js + generated types** | Авто-генерация типов из схемы |

---

## 🗂️ 2. Структура проекта

```
minigame/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts     # OAuth callback
│   ├── (games)/
│   │   ├── layout.tsx            # Общий layout для всех игр
│   │   ├── sudoku/page.tsx
│   │   ├── minesweeper/page.tsx
│   │   └── ...
│   ├── profile/page.tsx
│   ├── leaderboard/page.tsx
│   ├── layout.tsx                # Root layout (темы, провайдеры)
│   └── page.tsx                  # Главная страница
│
├── components/
│   ├── ui/                       # Shadcn-компоненты
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ThemeToggle.tsx
│   ├── auth/
│   │   ├── GoogleOneTap.tsx      # Google One Tap всплывающий prompt
│   │   ├── AuthModal.tsx
│   │   └── UserMenu.tsx
│   ├── games/
│   │   ├── GameCard.tsx
│   │   └── GameGrid.tsx
│   └── shared/
│       ├── Timer.tsx
│       ├── ScoreBoard.tsx
│       └── DifficultySelector.tsx
│
├── games/                        # Игровая логика (чистый TS, без React)
│   ├── registry.ts               # Централизованный реестр игр
│   ├── sudoku/
│   │   ├── engine.ts
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── hooks/useSudoku.ts
│   ├── minesweeper/
│   │   ├── engine.ts
│   │   ├── types.ts
│   │   └── hooks/useMinesweeper.ts
│   └── ...
│
├── stores/
│   ├── authStore.ts
│   ├── themeStore.ts
│   ├── gameStore.ts
│   └── settingsStore.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   └── cloudflare/
│       └── client.ts
│
├── styles/
│   ├── globals.css               # CSS-переменные тем
│   └── themes/
│       ├── light.css             # Белая тема (дефолт)
│       └── dark.css              # Чёрная тема
│
├── types/
│   ├── game.ts
│   └── user.ts
│
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
└── supabase/
    ├── migrations/
    └── seed.sql
```

---

## 🎨 3. Система тем

### Архитектура

Темы реализованы через **CSS Custom Properties** на уровне `<html data-theme="...">`. Zustand-стор + `localStorage` для персистентности.

```css
/* styles/globals.css */
:root, [data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f4f4f5;
  --text-primary: #18181b;
  --text-secondary: #71717a;
  --accent: #6366f1;
  --border: #e4e4e7;
  --card: #ffffff;
  --shadow: 0 4px 24px rgba(0,0,0,0.06);
}

[data-theme="dark"] {
  --bg-primary: #09090b;
  --bg-secondary: #18181b;
  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --accent: #818cf8;
  --border: #27272a;
  --card: #18181b;
  --shadow: 0 4px 24px rgba(0,0,0,0.4);
}
```

### Доступные темы

| Ключ | Название | Статус |
|---|---|---|
| `light` | ☀️ Светлая (дефолт) | ✅ Реализовать первой |
| `dark` | 🌑 Тёмная | ✅ Реализовать |
| `...` | Другие темы | 🔜 По запросу |

> **Как добавить тему:** создать `styles/themes/<name>.css`, добавить ключ в `themeStore.ts` и в `ThemeToggle.tsx` — больше ничего.

---

## 🔐 4. Авторизация

### Провайдеры

| Провайдер | Метод | Приоритет |
|---|---|---|
| **Google One Tap** | OAuth via Supabase `signInWithIdToken` | ⭐ Главный |
| Google (кнопка) | OAuth via Supabase | Резерв |
| Email + Password | Supabase Auth | ✅ |
| Email Magic Link | Supabase Auth | ✅ |
| Гостевой вход | Supabase `signInAnonymously()` | ✅ |

### Google One Tap

```
Поведение:
- Всплывает автоматически для незалогиненных (справа снизу / сверху)
- Не навязчив: после закрытия не показывается 24ч
- При успехе: google credential → Supabase signInWithIdToken()
```

### UX AuthModal (правый верхний угол → [Войти])

```
AuthModal:
  [G] Войти через Google
  ─────────────────────
  Email _________________
  Пароль ________________
  [Войти]  [Регистрация]
  ─────────────────────
  [Продолжить как гость]
```

После входа: аватар + имя + dropdown (Профиль / Настройки / Выйти).

---

## 🏠 5. Главная страница — Layout

```
┌──────────────────────────────────────────────────────────┐
│  🎮 MiniGames            [☀/🌑]  [Войти / UserMenu]      │  ← Header
├──────────────────────────────────────────────────────────┤
│                                                          │
│        Добро пожаловать в MiniGames                      │
│        Играй один или с друзьями                         │
│                                                          │
│  🔍 [Поиск...]   [Все | Логика | Стратегия | Мульти]     │
│                                                          │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐        │
│  │ Судоку │  │ Сапёр  │  │  2048  │  │ Змейка │        │
│  │  🔢    │  │  💣    │  │  🔢    │  │  🐍    │        │
│  │▶ Играть│  │▶ Играть│  │▶ Играть│  │▶ Играть│        │
│  └────────┘  └────────┘  └────────┘  └────────┘        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### GameCard содержит:
- Иконка / анимированное превью (hover-эффект)
- Название + краткое описание
- Теги: `Одиночная` / `Мультиплеер`, категория
- Кнопка **▶ Играть**
- Лучший результат пользователя (если залогинен)

---

## 🗄️ 6. База данных (Supabase)

```sql
-- Профили
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Каталог игр
CREATE TABLE games (
  id TEXT PRIMARY KEY,           -- 'sudoku', 'minesweeper', ...
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_multiplayer BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Игровые сессии
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  game_id TEXT REFERENCES games(id),
  difficulty TEXT,
  status TEXT DEFAULT 'active',  -- 'active' | 'completed' | 'abandoned'
  score INT,
  duration_seconds INT,
  moves INT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Лидерборд
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT REFERENCES games(id),
  difficulty TEXT,
  best_time_seconds INT,
  best_score INT,
  games_played INT DEFAULT 1,
  games_won INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, game_id, difficulty)
);

-- Достижения
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(id), -- NULL = общие
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

-- Настройки пользователя
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'ru',
  sound_enabled BOOLEAN DEFAULT TRUE,
  animations_enabled BOOLEAN DEFAULT TRUE,
  extra JSONB DEFAULT '{}'
);

-- Мультиплеер комнаты
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT REFERENCES games(id),
  host_id UUID REFERENCES profiles(id),
  code TEXT UNIQUE,
  status TEXT DEFAULT 'waiting',
  max_players INT DEFAULT 2,
  state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_players (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  seat INT,
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);
```

### RLS политики

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile" ON profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sessions" ON game_sessions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Own leaderboard" ON leaderboard FOR ALL USING (auth.uid() = user_id);
```

---

## ☁️ 7. Cloudflare Workers

| Worker | Назначение |
|---|---|
| `chess-engine` | Stockfish WASM — не грузим клиент |
| `game-validator` | Валидация ходов для мультиплеера |
| `rate-limiter` | Защита от читов и абьюза |
| `websocket-relay` | Relay для мультиплеера (Durable Objects) |

---

## 🎯 8. Список игр и приоритеты

### Фаза 1 — Одиночные (MVP)

| # | Игра | Сложность реализации | Мультиплеер |
|---|---|---|---|
| 1 | **Судоку** ⭐ | Высокая | ❌ |
| 2 | Сапёр | Средняя | ❌ |
| 3 | 2048 | Низкая | ❌ |
| 4 | Змейка | Низкая | ❌ |
| 5 | Виселица | Низкая | ❌ |
| 6 | Wordle-клон | Средняя | ❌ |
| 7 | Найди пару | Средняя | ❌ |

### Фаза 2 — Два игрока (онлайн)

| # | Игра | Сложность | Мультиплеер |
|---|---|---|---|
| 8 | Крестики-нолики | Низкая | ✅ |
| 9 | Четыре в ряд | Средняя | ✅ |
| 10 | Пинг-понг | Средняя | ✅ |
| 11 | Морской бой | Высокая | ✅ |

### Фаза 3 — Стратегии с ИИ

| # | Игра | Сложность | ИИ |
|---|---|---|---|
| 12 | Шашки | Высокая | ✅ CF Worker |
| 13 | Шахматы | Очень высокая | ✅ Stockfish |

---

## 🧩 9. Архитектура игрового модуля (шаблон)

```
games/<name>/
├── engine.ts       # Чистая логика (нет React, нет Supabase)
├── types.ts        # TypeScript-типы игры
├── constants.ts    # Константы (размеры, сложности)
├── utils.ts
└── hooks/
    └── use<Name>.ts  # Хук: engine + UI + store
```

**Обязательный интерфейс движка:**

```typescript
interface GameEngine<State, Action> {
  createInitialState(options: GameOptions): State;
  applyAction(state: State, action: Action): State;
  isGameOver(state: State): boolean;
  getScore(state: State): number;
  isValidAction(state: State, action: Action): boolean;
}
```

**Регистрация в `games/registry.ts`:**

```typescript
export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'sudoku',
    name: 'Судоку',
    description: 'Классическая головоломка с цифрами',
    icon: '🔢',
    category: 'logic',
    path: '/sudoku',
    difficulties: ['easy', 'medium', 'hard', 'expert'],
    isMultiplayer: false,
    isActive: true,
  },
  // Добавить новую игру — одна запись здесь, карточка появится на главной
];
```

---

## 🔩 10. Zustand сторы

```typescript
// authStore.ts
interface AuthStore {
  user: User | null;
  isGuest: boolean;
  isLoading: boolean;
  signIn(provider: Provider): Promise<void>;
  signOut(): Promise<void>;
  continueAsGuest(): Promise<void>;
}

// themeStore.ts
interface ThemeStore {
  theme: 'light' | 'dark' | string;
  setTheme(theme: string): void;
}

// gameStore.ts
interface GameStore {
  currentGame: string | null;
  sessionId: string | null;
  startSession(gameId: string, difficulty: string): Promise<void>;
  endSession(result: SessionResult): Promise<void>;
}

// settingsStore.ts
interface SettingsStore {
  sound: boolean;
  animations: boolean;
  toggleSound(): void;
  toggleAnimations(): void;
}
```

---

## 🚀 11. Фазы разработки

### Фаза 0 — Инфраструктура

- [ ] Next.js 14 + TypeScript + Tailwind + Shadcn
- [ ] Supabase: проект, схема, RLS
- [ ] Vercel: деплой, env-переменные
- [ ] Header + Footer + ThemeToggle
- [ ] Система тем (light/dark, CSS vars + Zustand)
- [ ] Auth: Google One Tap + Email + Guest
- [ ] Middleware: защита маршрутов
- [ ] GameCard + GameGrid на главной

### Фаза 1 — Судоку (полная проработка)

- [ ] Движок: генерация (backtracking + symmetry)
- [ ] Движок: валидация + решатель (для подсказок)
- [ ] UI: сетка 9×9, клавиатура + тач
- [ ] UI: сложности (Easy/Medium/Hard/Expert)
- [ ] UI: таймер, счётчик ошибок, пауза, сброс, подсказка
- [ ] Сохранение прогресса в Supabase
- [ ] Лидерборд по времени и сложности
- [ ] Достижения (первое решение, без ошибок, за N мин)

### Фаза 2 — Сапёр

- [ ] Движок: генерация, мины, flood-fill
- [ ] UI: поле, флажки, таймер, счётчик мин
- [ ] Размеры: 9×9/10м, 16×16/40м, 30×16/99м, кастом
- [ ] Рекорды + лидерборд

### Фаза 3 — Быстрые одиночные игры

- [ ] 2048
- [ ] Змейка
- [ ] Виселица
- [ ] Wordle-клон
- [ ] Найди пару

### Фаза 4 — Мультиплеер

- [ ] Крестики-нолики (онлайн)
- [ ] Четыре в ряд (онлайн)
- [ ] Пинг-понг (WebSocket + CF Durable Objects)
- [ ] Морской бой (лобби, комнаты)

### Фаза 5 — Стратегии с ИИ

- [ ] Шашки (minimax + α-β в CF Worker)
- [ ] Шахматы (Stockfish WASM в CF Worker)

---

## ⚡ 12. Производительность и качество

| Принцип | Реализация |
|---|---|
| Code Splitting | Каждая игра — `dynamic import()`, не грузим лишнее |
| Оптимистичные обновления | Zustand локально, Supabase в фоне |
| Offline | PWA + Service Worker для одиночных игр |
| Анимации | Framer Motion + Tailwind micro-animations |
| Доступность | ARIA-атрибуты, полная поддержка клавиатуры |
| Тесты | Vitest для движков, Playwright для E2E |

---

## 📦 13. Переменные окружения

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_GOOGLE_CLIENT_ID=    # для Google One Tap

CLOUDFLARE_WORKER_URL=
CLOUDFLARE_WORKER_TOKEN=
```

---

## 📋 14. Как добавить новую игру (чеклист)

1. Создать `games/<name>/` по шаблону (engine, types, hooks)
2. Добавить запись в `games/registry.ts`
3. Создать маршрут `app/(games)/<name>/page.tsx`
4. Добавить строку в таблицу `games` в Supabase (migration)
5. Написать тесты для движка
6. ✅ Карточка автоматически появляется на главной

---

## 🔮 15. Бэклог (будущие расширения)

- [ ] React Native / Expo мобильное приложение (движки переиспользуются)
- [ ] Турниры и лиги между пользователями
- [ ] Кастомные аватары и скины
- [ ] Чат в комнатах мультиплеера
- [ ] Система друзей
- [ ] Дополнительные темы оформления (добавляются по запросу)
- [ ] Локализация (ru / en / ...)
- [ ] Монетизация: Premium-темы, no-ads, эксклюзивные игры
