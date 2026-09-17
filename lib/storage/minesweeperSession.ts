// Локальное хранилище для игры Сапёр

import type { MinesweeperState, Difficulty } from '@/games/minesweeper/types'

const SESSION_KEY = 'minigame:minesweeper_session'
const BEST_TIME_KEY = 'minigame:minesweeper_best_time_'

export function getMinesweeperBestTime(difficulty: Difficulty): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${BEST_TIME_KEY}${difficulty}`)
    return raw ? parseInt(raw, 10) || null : null
  } catch {
    return null
  }
}

export function saveMinesweeperBestTime(difficulty: Difficulty, seconds: number): void {
  if (typeof window === 'undefined') return
  try {
    const current = getMinesweeperBestTime(difficulty)
    if (current === null || seconds < current) {
      localStorage.setItem(`${BEST_TIME_KEY}${difficulty}`, seconds.toString())
    }
  } catch {}
}

export function saveMinesweeperSession(state: MinesweeperState): void {
  if (typeof window === 'undefined') return
  if (state.status === 'won' || state.status === 'lost' || state.status === 'idle') {
    clearMinesweeperSession()
    return
  }

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {}
}

export function loadMinesweeperSession(): MinesweeperState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MinesweeperState
    if (!parsed || !Array.isArray(parsed.grid) || parsed.status === 'won' || parsed.status === 'lost') {
      clearMinesweeperSession()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clearMinesweeperSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}