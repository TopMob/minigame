// Локальное хранилище рекордов для игры Змейка

import type { Difficulty } from '@/games/snake/types'

const SNAKE_BEST_KEY = 'minigame:snake_best_'

export function getSnakeBestScore(difficulty: Difficulty): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(`${SNAKE_BEST_KEY}${difficulty}`)
    return raw ? parseInt(raw, 10) || 0 : 0
  } catch {
    return 0
  }
}

export function saveSnakeBestScore(difficulty: Difficulty, score: number): void {
  if (typeof window === 'undefined') return
  try {
    const current = getSnakeBestScore(difficulty)
    if (score > current) {
      localStorage.setItem(`${SNAKE_BEST_KEY}${difficulty}`, score.toString())
    }
  } catch {}
}