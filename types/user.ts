// Типы пользователя

export interface Profile {
  id: string
  username: string | null
  avatarUrl: string | null
  isGuest: boolean
  recentResults: GameResultEntry[]
  createdAt: string
}

export interface GameResultEntry {
  gameId: string
  difficulty: string
  score: number
  timeSeconds: number
  won: boolean
  playedAt: string
}

export interface UserSettings {
  userId: string
  theme: 'light' | 'dark'
  soundEnabled: boolean
  animationsEnabled: boolean
  extra: Record<string, unknown>
}

export interface LeaderboardEntry {
  userId: string
  gameId: string
  difficulty: string
  bestTimeSeconds: number | null
  bestScore: number | null
  gamesPlayed: number
  gamesWon: number
  updatedAt: string
}

export type AuthMethod = 'google' | 'email' | 'magic_link' | 'guest'
