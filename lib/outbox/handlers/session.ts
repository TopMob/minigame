// Хэндлер Outbox: завершение игровой сессии
// Каркас — полная реализация в Фазе 1

import type { OutboxItem } from '../types'

export async function processSession(item: OutboxItem): Promise<void> {
  if (item.mutation.type !== 'session.finish') return

  const { sessionId, score, duration, moves } = item.mutation.payload

  // Заглушка — будет вставлять запись в game_sessions
  console.log('Outbox: сессия', { sessionId, score, duration, moves })
}
