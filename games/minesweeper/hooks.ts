'use client'

// React-хук для игры Сапёр: таймер, режимы тапа (копать/флаг), хординг и звуки

import { useState, useCallback, useEffect, useRef } from 'react'
import { minesweeperEngine } from './engine'
import type { MinesweeperState, Difficulty } from './types'
import {
  loadMinesweeperSession,
  saveMinesweeperSession,
  clearMinesweeperSession,
  saveMinesweeperBestTime,
} from '@/lib/storage/minesweeperSession'
import { soundManager } from '@/lib/audio/sounds'

export interface UseMinesweeperReturn {
  state: MinesweeperState
  mode: 'reveal' | 'flag'
  isPressing: boolean
  toggleMode: () => void
  reveal: (row: number, col: number) => void
  toggleFlag: (row: number, col: number) => void
  chord: (row: number, col: number) => void
  handleClick: (row: number, col: number) => void
  restart: () => void
  setDifficulty: (diff: Difficulty) => void
  setIsPressing: (val: boolean) => void
}

export function useMinesweeper(initialDifficulty: Difficulty = 'easy'): UseMinesweeperReturn {
  const [session] = useState(() => loadMinesweeperSession())
  const [state, setState] = useState<MinesweeperState>(() => {
    if (session) return session
    return minesweeperEngine.createInitialState({ difficulty: initialDifficulty })
  })

  const [mode, setMode] = useState<'reveal' | 'flag'>('reveal')
  const [isPressing, setIsPressing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Таймер игры
  useEffect(() => {
    if (state.status === 'playing') {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.status !== 'playing') return prev
          return { ...prev, timeElapsed: Math.min(999, prev.timeElapsed + 1) }
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.status])

  // Автосохранение и рекорды
  useEffect(() => {
    saveMinesweeperSession(state)

    if (state.status === 'won') {
      soundManager.playVictory()
      saveMinesweeperBestTime(state.difficulty, state.timeElapsed)
    } else if (state.status === 'lost') {
      soundManager.playGameOver()
    }
  }, [state])

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'reveal' ? 'flag' : 'reveal'))
  }, [])

  const reveal = useCallback((row: number, col: number) => {
    setState((prev) => minesweeperEngine.applyAction(prev, { type: 'reveal', row, col }))
  }, [])

  const toggleFlag = useCallback((row: number, col: number) => {
    setState((prev) => minesweeperEngine.applyAction(prev, { type: 'toggleFlag', row, col }))
  }, [])

  const chord = useCallback((row: number, col: number) => {
    setState((prev) => minesweeperEngine.applyAction(prev, { type: 'chord', row, col }))
  }, [])

  const handleClick = useCallback(
    (row: number, col: number) => {
      if (mode === 'flag') {
        toggleFlag(row, col)
      } else {
        const cell = state.grid[row][col]
        if (cell.isRevealed && cell.adjacentMines > 0) {
          chord(row, col)
        } else {
          reveal(row, col)
        }
      }
    },
    [mode, state.grid, toggleFlag, chord, reveal]
  )

  const restart = useCallback(() => {
    clearMinesweeperSession()
    setState((prev) => minesweeperEngine.createInitialState({ difficulty: prev.difficulty }))
  }, [])

  const setDifficulty = useCallback((diff: Difficulty) => {
    clearMinesweeperSession()
    setState(minesweeperEngine.createInitialState({ difficulty: diff }))
  }, [])

  return {
    state,
    mode,
    isPressing,
    toggleMode,
    reveal,
    toggleFlag,
    chord,
    handleClick,
    restart,
    setDifficulty,
    setIsPressing,
  }
}