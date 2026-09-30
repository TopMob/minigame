'use client'

// React-хук для игры Сапёр:
// - Аудиоэффекты при каждом клике, каскаде, установке флага и хординге
// - Умная система подсказок (детерминированный расчет)
// - Подсветка соседей при хординге (Chording preview)
// - Кастомные размеры поля и зум
// - Сохранение сессии и рекордов

import { useState, useCallback, useEffect, useRef } from 'react'
import { minesweeperEngine } from './engine'
import type { MinesweeperState, Difficulty, CustomBoardConfig } from './types'
import {
  loadMinesweeperSession,
  saveMinesweeperSession,
  clearMinesweeperSession,
  saveMinesweeperBestTime,
  getMinesweeperBestTime,
} from '@/lib/storage/minesweeperSession'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'

export interface UseMinesweeperReturn {
  state: MinesweeperState
  mode: 'reveal' | 'flag'
  isPressing: boolean
  useQuestionMarks: boolean
  zoom: number
  bestTime: number | null
  isMuted: boolean
  toggleMode: () => void
  toggleUseQuestionMarks: () => void
  setZoom: (z: number) => void
  toggleMute: () => void
  reveal: (row: number, col: number) => void
  toggleFlag: (row: number, col: number) => void
  chord: (row: number, col: number) => void
  handleClick: (row: number, col: number) => void
  restart: () => void
  setDifficulty: (diff: Difficulty, customConfig?: CustomBoardConfig) => void
  setCustomConfig: (config: CustomBoardConfig) => void
  requestHint: () => void
  clearHint: () => void
  highlightNeighbors: (row: number, col: number, enabled: boolean) => void
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
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted)
  const [zoom, setZoomState] = useState<number>(1)
  const [useQuestionMarks, setUseQuestionMarks] = useState<boolean>(false)
  const [bestTime, setBestTime] = useState<number | null>(() =>
    getMinesweeperBestTime(initialDifficulty)
  )

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordedRef = useRef(false)

  // Загрузка настроек вопроса и зума из localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const savedQ = localStorage.getItem('minigame:minesweeper_questions')
      if (savedQ !== null) setUseQuestionMarks(savedQ === 'true')
    } catch {}
  }, [])

  // Обновление рекорда при смене сложности
  useEffect(() => {
    setBestTime(getMinesweeperBestTime(state.difficulty))
  }, [state.difficulty])

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

    if (state.status === 'won' && !recordedRef.current) {
      recordedRef.current = true
      soundManager.playVictory()
      if (state.difficulty !== 'custom') {
        saveMinesweeperBestTime(state.difficulty, state.timeElapsed)
        setBestTime(getMinesweeperBestTime(state.difficulty))
      }
      saveGameRecord({
        gameId: 'minesweeper',
        difficulty: state.difficulty,
        score: minesweeperEngine.getScore(state),
        timeSeconds: state.timeElapsed,
        won: true,
      })
    } else if (state.status === 'lost' && !recordedRef.current) {
      recordedRef.current = true
      soundManager.playMinesweeperExplosion()
      saveGameRecord({
        gameId: 'minesweeper',
        difficulty: state.difficulty,
        score: 0,
        timeSeconds: state.timeElapsed,
        won: false,
      })
    }
  }, [state])

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'reveal' ? 'flag' : 'reveal'))
  }, [])

  const toggleUseQuestionMarks = useCallback(() => {
    setUseQuestionMarks((prev) => {
      const next = !prev
      try {
        localStorage.setItem('minigame:minesweeper_questions', next.toString())
      } catch {}
      return next
    })
  }, [])

  const setZoom = useCallback((z: number) => {
    setZoomState(z)
  }, [])

  const toggleMute = useCallback(() => {
    const muted = soundManager.toggleMute()
    setIsMuted(muted)
  }, [])

  const reveal = useCallback((row: number, col: number) => {
    setState((prev) => {
      const beforeRevealed = prev.cellsRevealed
      const next = minesweeperEngine.applyAction(prev, { type: 'reveal', row, col })
      const diff = next.cellsRevealed - beforeRevealed

      if (next.status === 'lost') {
        // Звук взрыва проиграется в useEffect
      } else if (diff > 0) {
        soundManager.playMinesweeperReveal(diff)
      }
      return next
    })
  }, [])

  const toggleFlag = useCallback(
    (row: number, col: number) => {
      setState((prev) => {
        const cell = prev.grid[row]?.[col]
        const willBeFlagged = !cell?.isFlagged
        soundManager.playMinesweeperFlag(willBeFlagged)

        return minesweeperEngine.applyAction(prev, {
          type: 'toggleFlag',
          row,
          col,
          useQuestionMarks,
        })
      })
    },
    [useQuestionMarks]
  )

  const chord = useCallback((row: number, col: number) => {
    setState((prev) => {
      const cell = prev.grid[row]?.[col]
      if (!cell || !cell.isRevealed || cell.adjacentMines === 0) return prev

      soundManager.playMinesweeperChord()
      const beforeRevealed = prev.cellsRevealed
      const next = minesweeperEngine.applyAction(prev, { type: 'chord', row, col })
      const diff = next.cellsRevealed - beforeRevealed

      if (next.status !== 'lost' && diff > 0) {
        soundManager.playMinesweeperReveal(diff)
      }
      return next
    })
  }, [])

  const handleClick = useCallback(
    (row: number, col: number) => {
      if (mode === 'flag') {
        toggleFlag(row, col)
      } else {
        const cell = state.grid[row]?.[col]
        if (!cell) return

        if (cell.isRevealed && cell.adjacentMines > 0) {
          chord(row, col)
        } else {
          reveal(row, col)
        }
      }
    },
    [mode, state.grid, toggleFlag, chord, reveal]
  )

  const highlightNeighbors = useCallback((row: number, col: number, enabled: boolean) => {
    setState((prev) =>
      minesweeperEngine.applyAction(prev, {
        type: 'highlightNeighbors',
        row,
        col,
        enabled,
      })
    )
  }, [])

  const requestHint = useCallback(() => {
    soundManager.playMinesweeperHint()
    setState((prev) => minesweeperEngine.applyAction(prev, { type: 'getHint' }))
  }, [])

  const clearHint = useCallback(() => {
    setState((prev) => minesweeperEngine.applyAction(prev, { type: 'clearHint' }))
  }, [])

  const restart = useCallback(() => {
    recordedRef.current = false
    clearMinesweeperSession()
    soundManager.playClick()
    setState((prev) =>
      minesweeperEngine.createInitialState({
        difficulty: prev.difficulty,
        customConfig: prev.customConfig,
      })
    )
  }, [])

  const setDifficulty = useCallback(
    (diff: Difficulty, customConfig?: CustomBoardConfig) => {
      recordedRef.current = false
      clearMinesweeperSession()
      soundManager.playClick()
      setState(
        minesweeperEngine.createInitialState({
          difficulty: diff,
          customConfig: customConfig || state.customConfig,
        })
      )
    },
    [state.customConfig]
  )

  const setCustomConfig = useCallback((config: CustomBoardConfig) => {
    recordedRef.current = false
    clearMinesweeperSession()
    soundManager.playClick()
    setState(
      minesweeperEngine.createInitialState({
        difficulty: 'custom',
        customConfig: config,
      })
    )
  }, [])

  return {
    state,
    mode,
    isPressing,
    useQuestionMarks,
    zoom,
    bestTime,
    isMuted,
    toggleMode,
    toggleUseQuestionMarks,
    setZoom,
    toggleMute,
    reveal,
    toggleFlag,
    chord,
    handleClick,
    restart,
    setDifficulty,
    setCustomConfig,
    requestHint,
    clearHint,
    highlightNeighbors,
    setIsPressing,
  }
}