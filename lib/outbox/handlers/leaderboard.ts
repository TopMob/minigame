// Хэндлер Outbox: обновление лидерборда

import { supabase } from '@/lib/supabase/client'
import type { OutboxItem } from '../types'

export async function processLeaderboard(item: OutboxItem): Promise<void> {
  if (item.mutation.type !== 'leaderboard.upsert') return

  const { gameId, difficulty, time, score, won } = item.mutation.payload

  const { error } = await supabase.rpc('upsert_leaderboard', {
    p_game_id: gameId,
    p_difficulty: difficulty,
    p_time: time,
    p_score: score,
    p_won: won,
  })

  if (error) throw new Error(`Ошибка обновления лидерборда: ${error.message}`)
}
