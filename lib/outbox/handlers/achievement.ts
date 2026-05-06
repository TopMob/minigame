// Хэндлер Outbox: выдача достижения
// Каркас — полная реализация в Фазе 1

import type { OutboxItem } from '../types'

export async function processAchievement(item: OutboxItem): Promise<void> {
  if (item.mutation.type !== 'achievement.grant') return

  const { achievementId } = item.mutation.payload

  // Заглушка — будет вставлять запись в user_achievements
  console.log('Outbox: достижение', { achievementId })
}
