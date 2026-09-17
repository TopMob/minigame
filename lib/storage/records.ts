export interface GameRecord {
  id: string
  gameId: string
  difficulty: string
  timeSeconds: number
  score: number
  won: boolean
  playedAt: string
}

export interface DifficultyStats {
  difficulty: string
  bestTimeSeconds: number | null
  bestScore: number | null
  gamesPlayed: number
  gamesWon: number
}

const RECORDS_KEY = 'minigame:records'

export function getAllGameRecords(): GameRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveGameRecord(data: Omit<GameRecord, 'id' | 'playedAt'>): GameRecord {
  const records = getAllGameRecords()
  const newRecord: GameRecord = {
    ...data,
    id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    playedAt: new Date().toISOString(),
  }

  const updated = [newRecord, ...records].slice(0, 100) // храним последние 100 игр
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(updated))
  } catch {}

  return newRecord
}

export function getLeaderboardStats(gameId: string = 'sudoku'): DifficultyStats[] {
  const records = getAllGameRecords().filter((r) => r.gameId === gameId)
  const difficulties = ['easy', 'medium', 'hard', 'expert']

  return difficulties.map((diff) => {
    const diffRecords = records.filter((r) => r.difficulty === diff)
    const wonRecords = diffRecords.filter((r) => r.won)

    const bestTimeSeconds = wonRecords.length > 0
      ? Math.min(...wonRecords.map((r) => r.timeSeconds))
      : null

    const bestScore = wonRecords.length > 0
      ? Math.max(...wonRecords.map((r) => r.score))
      : null

    return {
      difficulty: diff,
      bestTimeSeconds,
      bestScore,
      gamesPlayed: diffRecords.length,
      gamesWon: wonRecords.length,
    }
  })
}

export function getPlayerOverallStats() {
  const records = getAllGameRecords()
  const won = records.filter((r) => r.won)
  const totalScore = records.reduce((acc, r) => acc + r.score, 0)

  return {
    totalGames: records.length,
    gamesWon: won.length,
    winRate: records.length > 0 ? Math.round((won.length / records.length) * 100) : 0,
    totalScore,
  }
}

export function clearAllGameRecords() {
  try {
    localStorage.removeItem(RECORDS_KEY)
  } catch {}
}
