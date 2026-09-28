'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import {
  createWordleState,
  addLetter,
  deleteLetter,
  submitGuess,
  getWordleScore,
  RUSSIAN_KEYBOARD_ROWS,
} from './engine'
import { isValidWord } from './words'
import type { WordleState } from './types'

const DAILY_STORAGE_PREFIX = 'minigame:wordle_daily_'

function getDailyStorageKey(): string {
  return `${DAILY_STORAGE_PREFIX}${new Date().toISOString().slice(0, 10)}`
}

function loadDailyState(): WordleState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getDailyStorageKey())
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveDailyState(state: WordleState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getDailyStorageKey(), JSON.stringify(state))
  } catch {}
}

export function useWordle(initialMode: 'daily' | 'random' = 'daily') {
  const [mode, setModeState] = useState<'daily' | 'random'>(initialMode)
  const [state, setState] = useState<WordleState>(() => {
    if (initialMode === 'daily') {
      const saved = loadDailyState()
      if (saved) return saved
    }
    return createWordleState(initialMode)
  })
  const isSavedRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  // Для анимации переворота тайлов
  const [revealingRow, setRevealingRow] = useState<number | null>(null)

  // Автосохранение слова дня
  useEffect(() => {
    if (mode === 'daily') {
      saveDailyState(state)
    }
  }, [state, mode])

  // Сохранение результата
  useEffect(() => {
    if (state.status === 'in_progress') {
      isSavedRef.current = false
      return
    }
    if (isSavedRef.current) return
    isSavedRef.current = true

    const timeSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000))

    if (state.status === 'won') {
      soundManager.playVictory()
    } else {
      soundManager.playGameOver()
    }

    saveGameRecord({
      gameId: 'wordle',
      difficulty: mode,
      score: getWordleScore(state),
      timeSeconds,
      won: state.status === 'won',
    })
  }, [state, mode])

  const handleAdd = useCallback((letter: string) => {
    const norm = letter.toUpperCase().replace(/Ё/g, 'Е')
    setState((prev) => {
      if (prev.status !== 'in_progress') return prev
      soundManager.playClick()
      return addLetter(prev, norm)
    })
  }, [])

  const handleDelete = useCallback(() => {
    setState((prev) => deleteLetter(prev))
  }, [])

  const handleSubmit = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'in_progress') return

    const next = submitGuess(current, true, isValidWord)
    if (next.shake) {
      soundManager.playGameOver()
      setTimeout(() => setState((s) => ({ ...s, shake: false, errorMessage: null })), 700)
    } else if (next.currentRow > current.currentRow) {
      const rowIndex = current.currentRow
      setRevealingRow(rowIndex)
      setTimeout(() => setRevealingRow(null), 1800)
      soundManager.playClick()
    }
    setState(next)
  }, [])

  // Клавиатурный ввод
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const key = e.key

      if (key === 'Enter') {
        handleSubmit()
        return
      }
      if (key === 'Backspace' || key === 'Delete') {
        handleDelete()
        return
      }
      // Русская буква (с заменой Ё на Е)
      const upper = key.toUpperCase().replace(/Ё/g, 'Е')
      if (/^[А-Я]$/.test(upper)) {
        handleAdd(upper)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleAdd, handleDelete, handleSubmit])

  const restart = useCallback((newMode?: 'daily' | 'random') => {
    const m = newMode ?? mode
    setModeState(m)
    if (m === 'daily') {
      const saved = loadDailyState()
      if (saved && (saved.status === 'won' || saved.status === 'lost')) {
        setState(saved)
      } else {
        const fresh = createWordleState('daily')
        setState(fresh)
        saveDailyState(fresh)
      }
    } else {
      setState(createWordleState('random'))
    }
    isSavedRef.current = false
    setRevealingRow(null)
  }, [mode])

  const setMode = useCallback((m: 'daily' | 'random') => {
    restart(m)
  }, [restart])

  return {
    state,
    mode,
    revealingRow,
    handleAdd,
    handleDelete,
    handleSubmit,
    restart,
    setMode,
    keyboardRows: RUSSIAN_KEYBOARD_ROWS,
  }
}
