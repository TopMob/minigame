-- Фаза 0: Начальная миграция
-- Таблицы: profiles, games, leaderboard, user_settings
-- RLS политики и RPC функции

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

-- Начальные данные каталога игр (синхронизация с registry.ts)
INSERT INTO games (id, name, category, is_multiplayer, is_active, sort_order) VALUES
  ('sudoku',       'Судоку',              'logic',   FALSE, TRUE,  1),
  ('minesweeper',  'Сапёр',               'logic',   FALSE, FALSE, 2),
  ('2048',         '2048',                'arcade',  FALSE, FALSE, 3),
  ('snake',        'Змейка',              'arcade',  FALSE, FALSE, 4),
  ('hangman',      'Виселица',            'word',    FALSE, FALSE, 5),
  ('wordle',       'Словоцепь',           'word',    FALSE, FALSE, 6),
  ('memory',       'Найди пару',          'logic',   FALSE, FALSE, 7),
  ('tictactoe',    'Крестики-нолики',     'board',   TRUE,  FALSE, 8),
  ('connect4',     '4 в ряд',            'board',   TRUE,  FALSE, 9),
  ('reversi',      'Реверси',             'board',   FALSE, FALSE, 10),
  ('checkers',     'Шашки',              'board',   FALSE, FALSE, 11),
  ('chess',        'Шахматы',            'board',   FALSE, FALSE, 12),
  ('battleship',   'Морской бой',        'board',   TRUE,  FALSE, 13),
  ('pong',         'Пинг-понг',          'arcade',  TRUE,  FALSE, 14);
