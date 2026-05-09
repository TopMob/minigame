'use client'

// React-хук для Судоку — управление состоянием игры, undo/redo, таймер

import { useState, useCallback, useRef, useEffect } from 'react'
import { sudokuEngine, getSudokuHint } from './engine'
import type { SudokuState, SudokuAction, SudokuOptions, Difficulty, Digit } from './types'

interface HistoryEntry {
  state: SudokuState
  action: SudokuAction
}

export interface UseSudokuReturn {
  state: SudokuState
  // Действия
  placeDigit: (row: number, col: number, digit: Digit) => void
  eraseCell: (row: number, col: number) => void
  toggleNote: (row: number, col: number, digit: Digit) => void
  applyHint: () => void
  // Навигация
  selectCell: (row: number, col: number) => void
  // Режимы
  toggleNoteMode: () => void
  // Управление
  undo: () => void
  redo: () => void
  pause: () => void
  resume: () => void
  newGame: (difficulty: Difficulty) => void
  restart: () => void
  // Состояние
  canUndo: boolean
  canRedo: boolean
  isPaused: boolean
}

export function useSudoku(initialDifficulty: Difficulty = 'easy'): UseSudokuReturn {
  const [state, setState] = useState<SudokuState>(() =>
    sudokuEngine.createInitialState({ difficulty: initialDifficulty })
  )
  const [isPaused, setIsPaused] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const initialSeedRef = useRef(state.seed)
  const initialDifficultyRef = useRef(state.difficulty)

  // Таймер
  useEffect(() => {
    if (state.isComplete || state.isFailed || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setState((prev) => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }))
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [state.isComplete, state.isFailed, isPaused])

  // Применить действие с сохранением истории
  const applyAction = useCallback((action: SudokuAction) => {
    setState((prev) => {
      if (!sudokuEngine.isValidAction(prev, action)) return prev
      const next = sudokuEngine.applyAction(prev, action)
      setHistory((h) => [...h, { state: prev, action }])
      setRedoStack([])
      return next
    })
  }, [])

  const placeDigit = useCallback(
    (row: number, col: number, digit: Digit) => {
      applyAction({ type: 'place', row, col, digit })
    },
    [applyAction]
  )

  const eraseCell = useCallback(
    (row: number, col: number) => {
      applyAction({ type: 'erase', row, col })
    },
    [applyAction]
  )

  const toggleNote = useCallback(
    (row: number, col: number, digit: Digit) => {
      applyAction({ type: 'toggleNote', row, col, digit })
    },
    [applyAction]
  )

  const applyHint = useCallback(() => {
    setState((prev) => {
      const hintAction = getSudokuHint(prev)
      if (!hintAction) return prev
      const next = sudokuEngine.applyAction(prev, hintAction)
      setHistory((h) => [...h, { state: prev, action: hintAction }])
      setRedoStack([])
      return next
    })
  }, [])

  const selectCell = useCallback((row: number, col: number) => {
    setState((prev) => ({ ...prev, selectedCell: { row, col } }))
  }, [])

  const toggleNoteMode = useCallback(() => {
    setState((prev) => ({ ...prev, isNoteMode: !prev.isNoteMode }))
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const last = h[h.length - 1]
      setRedoStack((r) => [...r, { state: last.state, action: last.action }])
      setState((prev) => ({ ...last.state, timeElapsed: prev.timeElapsed }))
      return h.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r
      const last = r[r.length - 1]
      setState((prev) => {
        const next = sudokuEngine.applyAction(prev, last.action)
        setHistory((h) => [...h, { state: prev, action: last.action }])
        return next
      })
      return r.slice(0, -1)
    })
  }, [])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])

  const newGame = useCallback((difficulty: Difficulty) => {
    const newState = sudokuEngine.createInitialState({ difficulty })
    setState(newState)
    setHistory([])
    setRedoStack([])
    setIsPaused(false)
    initialSeedRef.current = newState.seed
    initialDifficultyRef.current = difficulty
  }, [])

  const restart = useCallback(() => {
    const newState = sudokuEngine.createInitialState(
      { difficulty: initialDifficultyRef.current },
      initialSeedRef.current
    )
    setState(newState)
    setHistory([])
    setRedoStack([])
    setIsPaused(false)
  }, [])

  return {
    state,
    placeDigit,
    eraseCell,
    toggleNote,
    applyHint,
    selectCell,
    toggleNoteMode,
    undo,
    redo,
    pause,
    resume,
    newGame,
    restart,
    canUndo: history.length > 0,
    canRedo: redoStack.length > 0,
    isPaused,
  }
}
