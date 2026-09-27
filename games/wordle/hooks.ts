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

export function useWordle(initialMode: 'daily' | 'random' = 'daily') {
  const [state, setState] = useState<WordleState>(() =>
    createWordleState(initialMode)
  )
  const [mode, setModeState] = useState<'daily' | 'random'>(initialMode)
  const isSavedRef = useRef(false)
  // Для анимации переворота тайлов
  const [revealingRow, setRevealingRow] = useState<number | null>(null)

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
      // Русская буква
      const upper = key.toUpperCase()
      if (/^[А-ЯЁ]$/.test(upper)) {
        handleAdd(upper)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleAdd = useCallback((letter: string) => {
    setState((prev) => {
      if (prev.status !== 'in_progress') return prev
      soundManager.playClick()
      return addLetter(prev, letter)
    })
  }, [])

  const handleDelete = useCallback(() => {
    setState((prev) => deleteLetter(prev))
  }, [])

  const handleSubmit = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'in_progress') return prev
      const next = submitGuess(prev, true, isValidWord)
      if (next.shake) {
        // Звук ошибки
        soundManager.playGameOver()
        // Убираем shake через 600ms
        setTimeout(() => setState((s) => ({ ...s, shake: false, errorMessage: null })), 700)
      } else if (next.currentRow > prev.currentRow) {
        // Начинаем анимацию переворота для строки
        const rowIndex = prev.currentRow
        setRevealingRow(rowIndex)
        setTimeout(() => setRevealingRow(null), 1800)
        soundManager.playClick()
      }
      return next
    })
  }, [])

  const restart = useCallback((newMode?: 'daily' | 'random') => {
    const m = newMode ?? mode
    setModeState(m)
    setState(createWordleState(m))
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
