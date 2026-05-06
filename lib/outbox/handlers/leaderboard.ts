// Хэндлер Outbox: обновление лидерборда
// Каркас — полная реализация в Фазе 1

import type { OutboxItem } from '../types'

export async function processLeaderboard(item: OutboxItem): Promise<void> {
  if (item.mutation.type !== 'leaderboard.upsert') return

  const { gameId, difficulty, time, score, won } = item.mutation.payload

  // Заглушка — будет вызывать supabase.rpc('upsert_leaderboard', ...)
  console.log('Outbox: лидерборд', { gameId, difficulty, time, score, won })
}
