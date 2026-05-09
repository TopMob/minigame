// Типы для Outbox-паттерна (Sync Queue)

export type Mutation =
  | { type: 'leaderboard.upsert'; payload: { gameId: string; difficulty: string; time: number; score: number; won: boolean } }
  | { type: 'session.finish'; payload: { gameId: string; difficulty: string; score: number; duration: number; moves: number } }
  | { type: 'achievement.grant'; payload: { achievementId: string } }

export interface OutboxItem {
  id: string              // UUID, генерируется на клиенте → используется как client_uuid в БД
  mutation: Mutation
  createdAt: number
  retries: number
  lastError?: string
  status: 'pending' | 'processing' | 'dead'
}

export const MAX_RETRIES = 6
export const DRAIN_INTERVAL_MS = 30_000 // 30 секунд
