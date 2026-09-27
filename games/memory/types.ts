// Типы для игры Найди пару (Memory Match)

export type MemoryDifficulty = 'easy' | 'medium' | 'hard'
export type MemoryStatus = 'in_progress' | 'won'

export interface MemoryCard {
  id: number      // уникальный id карточки (0..N-1)
  pairId: number  // id пары (0..N/2-1) — одинаковый у двух карточек
  emoji: string   // отображаемый символ
  isFlipped: boolean  // перевёрнута лицом вверх
  isMatched: boolean  // пара найдена (остаётся открытой)
}

export interface MemoryState {
  cards: MemoryCard[]
  flippedIds: number[]    // id карточек, открытых в текущий ход (0, 1 или 2)
  matchedPairs: number    // количество найденных пар
  totalPairs: number      // общее количество пар
  moves: number           // число ходов
  status: MemoryStatus
  difficulty: MemoryDifficulty
  startTime: number
  isChecking: boolean     // блокировка кликов во время проверки пары
  bestMoves: number | null  // лучший результат (из localStorage)
}
