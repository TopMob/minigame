// Хэндлер Outbox: завершение игровой сессии

import { supabase } from '@/lib/supabase/client'
import type { OutboxItem } from '../types'

export async function processSession(item: OutboxItem): Promise<void> {
  if (item.mutation.type !== 'session.finish') return

  const { sessionId, score, duration, moves } = item.mutation.payload

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('game_sessions').upsert(
    {
      client_uuid: item.id,
      user_id: user.id,
      game_id: sessionId,
      score,
      duration_seconds: duration,
      moves,
      status: 'finished',
      finished_at: new Date().toISOString(),
    },
    { onConflict: 'client_uuid' }
  )

  if (error) throw new Error(`Ошибка записи сессии: ${error.message}`)
}
