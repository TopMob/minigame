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
  WORD_LENGTH,
} from './engine'
import { isValidWord } from './words'
import type { WordleState } from './types'

const DAILY_STORAGE_PREFIX = 'minigame:wordle_daily_'
const RANDOM_STORAGE_KEY = 'minigame:wordle_random_state'

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

function loadRandomState(): WordleState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(RANDOM_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveRandomState(state: WordleState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RANDOM_STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// Автоматическая раскладка клавиатуры (en -> ru)
const EN_TO_RU_MAP: Record<string, string> = {
  q: 'Й', w: 'Ц', e: 'У', r: 'К', t: 'Е', y: 'Н', u: 'Г', i: 'Ш', o: 'Щ', p: 'З',
  '[': 'Х', '{': 'Х', ']': 'Ъ', '}': 'Ъ',
  a: 'Ф', s: 'Ы', d: 'В', f: 'А', g: 'П', h: 'Р', j: 'О', k: 'Л', l: 'Д',
  ';': 'Ж', ':': 'Ж', "'": 'Э', '"': 'Э',
  z: 'Я', x: 'Ч', c: 'С', v: 'М', b: 'И', n: 'Т', m: 'Ь',
  ',': 'Б', '<': 'Б', '.': 'Ю', '>': 'Ю',
  '`': 'Е', '~': 'Е',
}

export function useWordle(initialMode: 'daily' | 'random' = 'daily') {
  const [mode, setModeState] = useState<'daily' | 'random'>(initialMode)
  const [state, setState] = useState<WordleState>(() => {
    if (initialMode === 'daily') {
      const saved = loadDailyState()
      if (saved) return saved
    } else {
      const saved = loadRandomState()
      if (saved && saved.status === 'in_progress') return saved
    }
    return createWordleState(initialMode)
  })

  const isSavedRef = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Для анимации переворота тайлов
  const [revealingRow, setRevealingRow] = useState<number | null>(null)

  // Автосохранение состояния в зависимости от режима
  useEffect(() => {
    if (mode === 'daily') {
      saveDailyState(state)
    } else {
      saveRandomState(state)
    }
  }, [state, mode])

  // Сохранение рекорда при завершении игры
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
  }, [state.status, state.startTime, state.currentRow, mode])

  const handleAdd = useCallback((letter: string) => {
    const norm = letter.toUpperCase().replace(/Ё/g, 'Е')
    setState((prev) => {
      if (prev.status !== 'in_progress') return prev
      soundManager.playClick()
      return addLetter(prev, norm)
    })
  }, [])

  const handleDelete = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'in_progress') return prev
      return deleteLetter(prev)
    })
  }, [])

  const handleSubmit = useCallback(() => {
    const current = stateRef.current
    if (current.status !== 'in_progress') return
    if (revealingRow !== null) return // Не отправлять повторно во время анимации

    if (current.currentGuess.length < WORD_LENGTH) {
      soundManager.playGameOver()
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current)
      setState((s) => ({ ...s, errorMessage: 'Недостаточно букв', shake: true }))
      shakeTimeoutRef.current = setTimeout(() => {
        setState((s) => ({ ...s, shake: false, errorMessage: null }))
      }, 700)
      return
    }

    const next = submitGuess(current, true, isValidWord)
    if (next.shake) {
      soundManager.playGameOver()
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current)
      setState(next)
      shakeTimeoutRef.current = setTimeout(() => {
        setState((s) => ({ ...s, shake: false, errorMessage: null }))
      }, 700)
      return
    }

    if (next.currentRow > current.currentRow) {
      const rowIndex = current.currentRow
      setRevealingRow(rowIndex)
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
      revealTimeoutRef.current = setTimeout(() => {
        setRevealingRow(null)
      }, 1600)
      soundManager.playClick()
    }

    setState(next)
  }, [revealingRow])

  // Клавиатурный ввод (с авто-транслитерацией раскладки)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const key = e.key

      if (key === 'Enter') {
        e.preventDefault()
        handleSubmit()
        return
      }
      if (key === 'Backspace' || key === 'Delete') {
        e.preventDefault()
        handleDelete()
        return
      }

      // Русская буква (с заменой Ё на Е)
      const upper = key.toUpperCase().replace(/Ё/g, 'Е')
      if (/^[А-Я]$/.test(upper)) {
        e.preventDefault()
        handleAdd(upper)
        return
      }

      // Проверка английской раскладки
      const lower = key.toLowerCase()
      if (EN_TO_RU_MAP[lower]) {
        e.preventDefault()
        handleAdd(EN_TO_RU_MAP[lower])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleAdd, handleDelete, handleSubmit])

  // Переключение режима (не сбрасывает текущую игру, если просто кликнули по вкладке)
  const setMode = useCallback((newMode: 'daily' | 'random') => {
    if (newMode === mode) return
    setModeState(newMode)

    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current)
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    setRevealingRow(null)

    if (newMode === 'daily') {
      const saved = loadDailyState()
      if (saved) {
        setState(saved)
      } else {
        const fresh = createWordleState('daily')
        setState(fresh)
        saveDailyState(fresh)
      }
    } else {
      const saved = loadRandomState()
      if (saved && saved.status === 'in_progress') {
        setState(saved)
      } else {
        const fresh = createWordleState('random')
        setState(fresh)
        saveRandomState(fresh)
      }
    }
    isSavedRef.current = false
  }, [mode])

  // Начать новое случайное слово (гарантированно новое слово без багов)
  const newRandomWord = useCallback(() => {
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current)
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    setRevealingRow(null)

    setModeState('random')
    const fresh = createWordleState('random')
    setState(fresh)
    saveRandomState(fresh)
    isSavedRef.current = false
  }, [])

  // Перезапуск игры
  const restart = useCallback((targetMode?: 'daily' | 'random') => {
    const m = targetMode ?? mode
    if (m === 'random') {
      newRandomWord()
    } else {
      // Для ежедневного: сброс только если игра ещё не завершена или пользователь явно запросил
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current)
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
      setRevealingRow(null)

      const fresh = createWordleState('daily')
      setState(fresh)
      saveDailyState(fresh)
      isSavedRef.current = false
    }
  }, [mode, newRandomWord])

  return {
    state,
    mode,
    revealingRow,
    handleAdd,
    handleDelete,
    handleSubmit,
    restart,
    setMode,
    newRandomWord,
    keyboardRows: RUSSIAN_KEYBOARD_ROWS,
  }
}
