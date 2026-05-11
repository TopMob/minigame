// Добавление мутации в Outbox-очередь

import { addItem } from './db'
import { drain } from './drain'
import type { Mutation, OutboxItem } from './types'

// Генерация UUID v4
function uuid(): string {
  return crypto.randomUUID()
}

// Добавить мутацию в очередь и попытаться сразу синхронизировать
export async function enqueue(mutation: Mutation): Promise<string> {
  const item: OutboxItem = {
    id: uuid(),
    mutation,
    createdAt: Date.now(),
    retries: 0,
    status: 'pending',
  }

  await addItem(item)

  // Попытка немедленной синхронизации, если онлайн
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    drain().catch((error) => {
      console.error('Outbox drain failed:', error)
    })
  }

  return item.id
}
