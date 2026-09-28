'use client'

// React-хук для Судоку — управление состоянием игры, undo/redo, таймер

import { useState, useCallback, useRef, useEffect } from 'react'
import { sudokuEngine, getSudokuHint } from './engine'
import type { SudokuState, SudokuAction, Difficulty, Digit } from './types'
import { loadSudokuSession, saveSudokuSession, clearSudokuSession } from '@/lib/storage/sudokuSession'
import { saveGameRecord } from '@/lib/storage/records'

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
  const [state, setState] = useState<SudokuState>(() => {
    const saved = loadSudokuSession()
    if (saved && !saved.isComplete && !saved.isFailed) {
      return saved
    }
    return sudokuEngine.createInitialState({ difficulty: initialDifficulty })
  })
  const [isPaused, setIsPaused] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordedRef = useRef(false)
  const initialSeedRef = useRef(state.seed)
  const initialDifficultyRef = useRef(state.difficulty)

  // Автосохранение активной сессии и сохранение рекорда
  useEffect(() => {
    if (state.isComplete || state.isFailed) {
      clearSudokuSession()
    } else {
      saveSudokuSession(state)
    }

    if (state.isComplete && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'sudoku',
        difficulty: state.difficulty,
        score: sudokuEngine.getScore(state),
        timeSeconds: state.timeElapsed,
        won: true,
      })
    } else if (state.isFailed && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'sudoku',
        difficulty: state.difficulty,
        score: 0,
        timeSeconds: state.timeElapsed,
        won: false,
      })
    }
  }, [state])

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

  const stateRef = useRef(state)
  stateRef.current = state
  const historyRef = useRef(history)
  historyRef.current = history
  const redoRef = useRef(redoStack)
  redoRef.current = redoStack

  // Применить действие с сохранением истории
  const applyAction = useCallback((action: SudokuAction) => {
    const current = stateRef.current
    if (!sudokuEngine.isValidAction(current, action)) return
    const next = sudokuEngine.applyAction(current, action)
    setHistory((h) => [...h, { state: current, action }])
    setRedoStack([])
    setState(next)
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
    const current = stateRef.current
    const hintAction = getSudokuHint(current)
    if (!hintAction) return
    const next = sudokuEngine.applyAction(current, hintAction)
    setHistory((h) => [...h, { state: current, action: hintAction }])
    setRedoStack([])
    setState(next)
  }, [])

  const selectCell = useCallback((row: number, col: number) => {
    setState((prev) => ({ ...prev, selectedCell: { row, col } }))
  }, [])

  const toggleNoteMode = useCallback(() => {
    setState((prev) => ({ ...prev, isNoteMode: !prev.isNoteMode }))
  }, [])

  const undo = useCallback(() => {
    const h = historyRef.current
    if (h.length === 0) return
    const last = h[h.length - 1]
    const current = stateRef.current
    setHistory(h.slice(0, -1))
    setRedoStack((r) => [...r, { state: last.state, action: last.action }])
    // Не откатываем ошибки и штраф за подсказки
    setState({
      ...last.state,
      timeElapsed: current.timeElapsed,
      errors: current.errors,
      hintsUsed: current.hintsUsed,
      selectedCell: current.selectedCell,
      isNoteMode: current.isNoteMode,
    })
  }, [])

  const redo = useCallback(() => {
    const r = redoRef.current
    if (r.length === 0) return
    const last = r[r.length - 1]
    const current = stateRef.current
    const next = sudokuEngine.applyAction(current, last.action)
    setRedoStack(r.slice(0, -1))
    setHistory((h) => [...h, { state: current, action: last.action }])
    setState({
      ...next,
      timeElapsed: current.timeElapsed,
      errors: Math.max(current.errors, next.errors),
      hintsUsed: Math.max(current.hintsUsed, next.hintsUsed),
    })
  }, [])

  const pause = useCallback(() => setIsPaused(true), [])
  const resume = useCallback(() => setIsPaused(false), [])

  const newGame = useCallback((difficulty: Difficulty) => {
    recordedRef.current = false
    clearSudokuSession()
    const newState = sudokuEngine.createInitialState({ difficulty })
    setState(newState)
    setHistory([])
    setRedoStack([])
    setIsPaused(false)
    initialSeedRef.current = newState.seed
    initialDifficultyRef.current = difficulty
  }, [])

  const restart = useCallback(() => {
    recordedRef.current = false
    clearSudokuSession()
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
