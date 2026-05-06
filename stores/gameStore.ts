'use client'

import { create } from 'zustand'
import type { GameMeta } from '@/types/game'

interface GameState {
  currentGame: GameMeta | null
  isPlaying: boolean
  isPaused: boolean
  score: number
  timeElapsed: number

  setCurrentGame: (game: GameMeta | null) => void
  setPlaying: (playing: boolean) => void
  setPaused: (paused: boolean) => void
  setScore: (score: number) => void
  setTimeElapsed: (time: number) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()((set) => ({
  currentGame: null,
  isPlaying: false,
  isPaused: false,
  score: 0,
  timeElapsed: 0,

  setCurrentGame: (currentGame) => set({ currentGame }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPaused: (isPaused) => set({ isPaused }),
  setScore: (score) => set({ score }),
  setTimeElapsed: (timeElapsed) => set({ timeElapsed }),
  resetGame: () =>
    set({
      isPlaying: false,
      isPaused: false,
      score: 0,
      timeElapsed: 0,
    }),
}))
