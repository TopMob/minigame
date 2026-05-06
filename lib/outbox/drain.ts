// Фоновая синхронизация Outbox → Supabase
// Каркас — хэндлеры будут добавлены в Фазе 1

import { getPendingItems, removeItem, updateItem } from './db'
import { processLeaderboard } from './handlers/leaderboard'
import { processSession } from './handlers/session'
import { processAchievement } from './handlers/achievement'
import type { OutboxItem } from './types'
import { MAX_RETRIES } from './types'

let isDraining = false

// Обработка одного элемента очереди
async function processItem(item: OutboxItem): Promise<void> {
  switch (item.mutation.type) {
    case 'leaderboard.upsert':
      await processLeaderboard(item)
      break
    case 'session.finish':
      await processSession(item)
      break
    case 'achievement.grant':
      await processAchievement(item)
      break
  }
}

// Дренировать всю очередь
export async function drain(): Promise<void> {
  if (isDraining) return
  isDraining = true

  try {
    const items = await getPendingItems()

    for (const item of items) {
      try {
        await processItem(item)
        await removeItem(item.id)
      } catch (error) {
        const retries = item.retries + 1
        if (retries >= MAX_RETRIES) {
          await updateItem({
            ...item,
            retries,
            status: 'dead',
            lastError: error instanceof Error ? error.message : 'Неизвестная ошибка',
          })
        } else {
          await updateItem({
            ...item,
            retries,
            lastError: error instanceof Error ? error.message : 'Неизвестная ошибка',
          })
        }
      }
    }
  } finally {
    isDraining = false
  }
}
