-- Фаза 1: Судоку — таблицы game_sessions, achievements, user_achievements
-- + RPC merge_guest_into_user для Account Linking

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

CREATE INDEX idx_sessions_user_game ON game_sessions(user_id, game_id, started_at DESC);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions own" ON game_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TTL: автоматическое удаление сессий старше 90 дней (pg_cron)
-- SELECT cron.schedule('purge_old_sessions', '0 3 * * *',
--   $$DELETE FROM game_sessions WHERE finished_at < NOW() - INTERVAL '90 days'$$);
-- Примечание: pg_cron доступен только на платных тарифах Supabase.
-- На Free Tier удаление старых сессий можно делать вручную или через Edge Function.

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

-- Начальные достижения для Судоку
INSERT INTO achievements (id, game_id, name, description, icon, condition) VALUES
  ('sudoku_first_win', 'sudoku', 'Первая победа', 'Решите первый пазл Судоку', '🏆', '{"type": "first_win"}'),
  ('sudoku_no_errors', 'sudoku', 'Безупречно', 'Решите пазл без единой ошибки', '✨', '{"type": "no_errors"}'),
  ('sudoku_speed_easy', 'sudoku', 'Молния (лёгкий)', 'Решите лёгкий пазл менее чем за 5 минут', '⚡', '{"type": "speed", "difficulty": "easy", "max_seconds": 300}'),
  ('sudoku_speed_medium', 'sudoku', 'Молния (средний)', 'Решите средний пазл менее чем за 10 минут', '⚡', '{"type": "speed", "difficulty": "medium", "max_seconds": 600}'),
  ('sudoku_speed_hard', 'sudoku', 'Молния (сложный)', 'Решите сложный пазл менее чем за 20 минут', '⚡', '{"type": "speed", "difficulty": "hard", "max_seconds": 1200}'),
  ('sudoku_speed_expert', 'sudoku', 'Молния (эксперт)', 'Решите экспертный пазл менее чем за 30 минут', '⚡', '{"type": "speed", "difficulty": "expert", "max_seconds": 1800}'),
  ('sudoku_streak_5', 'sudoku', 'Серия из 5', 'Решите 5 пазлов подряд без ошибок', '🔥', '{"type": "streak", "count": 5}');

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
