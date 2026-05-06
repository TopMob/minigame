// Типы для игровой системы

export type GameCategory = 'logic' | 'arcade' | 'word' | 'board' | 'card'
export type ArchPattern = 'A' | 'B' | 'C' | 'D'

export interface GameMeta {
  id: string
  name: string // только русский
  icon: string
  category: GameCategory
  path: string
  difficulties: string[]
  isMultiplayer: boolean
  pattern: ArchPattern
  persistsSessions: boolean // true → пишем в game_sessions; false → только leaderboard / recent_results
  isActive: boolean
}

export type GameStatus = 'active' | 'paused' | 'finished' | 'abandoned'

export interface GameResult {
  gameId: string
  difficulty: string
  score: number
  timeSeconds: number
  won: boolean
  finishedAt: string
}
