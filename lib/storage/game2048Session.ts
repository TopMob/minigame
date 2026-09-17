// Автосохранение активной сессии и лучшего счета 2048 в localStorage

import type { Game2048State } from '@/games/2048/types'

const SESSION_KEY = 'minigame:2048_session'
const BEST_SCORE_KEY = 'minigame:2048_best_score'

export function get2048BestScore(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY)
    return raw ? parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

export function save2048BestScore(score: number): void {
  if (typeof window === 'undefined') return
  try {
    const current = get2048BestScore()
    if (score > current) {
      localStorage.setItem(BEST_SCORE_KEY, score.toString())
    }
  } catch {}
}

export function save2048Session(state: Game2048State, timeElapsed: number): void {
  if (typeof window === 'undefined') return
  if (state.isOver) {
    clear2048Session()
    return
  }

  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ state, timeElapsed }))
  } catch {}
}

export function load2048Session(): { state: Game2048State; timeElapsed: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.state || !Array.isArray(parsed.state.tiles)) {
      return null
    }
    if (parsed.state.isOver) {
      clear2048Session()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function clear2048Session(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}
