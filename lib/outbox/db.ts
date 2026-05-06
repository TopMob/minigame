// IndexedDB-обёртка для Outbox (через idb)
// Каркас — полная реализация в Фазе 1

import type { OutboxItem } from './types'

const DB_NAME = 'minigame-outbox'
const STORE_NAME = 'outbox'
const DB_VERSION = 1

// Открытие базы данных
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Добавить элемент в очередь
export async function addItem(item: OutboxItem): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).put(item)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Получить все ожидающие элементы
export async function getPendingItems(): Promise<OutboxItem[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const request = store.getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const items = (request.result as OutboxItem[]).filter(
        (item) => item.status === 'pending'
      )
      resolve(items)
    }
    request.onerror = () => reject(request.error)
  })
}

// Удалить элемент из очереди (после успешной синхронизации)
export async function removeItem(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  tx.objectStore(STORE_NAME).delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Обновить элемент (например, увеличить retries)
export async function updateItem(item: OutboxItem): Promise<void> {
  return addItem(item)
}
