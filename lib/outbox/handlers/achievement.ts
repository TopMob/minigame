// Хэндлер Outbox: выдача достижения

import { supabase } from '@/lib/supabase/client'
import type { OutboxItem } from '../types'

export async function processAchievement(item: OutboxItem): Promise<void> {
  if (item.mutation.type !== 'achievement.grant') return

  const { achievementId } = item.mutation.payload

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('user_achievements').upsert(
    {
      user_id: user.id,
      achievement_id: achievementId,
    },
    { onConflict: 'user_id,achievement_id' }
  )

  if (error) throw new Error(`Ошибка записи достижения: ${error.message}`)
}
