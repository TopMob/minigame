'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import {
  createHangmanState,
  guessLetter,
  getHangmanScore,
  getMaskedWord,
  getRemainingAttempts,
} from './engine'
import type { HangmanDifficulty, HangmanState } from './types'

export function useHangman(initialDifficulty: HangmanDifficulty = 'medium') {
  const [state, setState] = useState<HangmanState>(() =>
    createHangmanState(initialDifficulty)
  )

  const isSavedRef = useRef(false)

  // Сохранение результата при окончании
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
      gameId: 'hangman',
      difficulty: state.difficulty,
      score: getHangmanScore(state),
      timeSeconds,
      won: state.status === 'won',
    })
  }, [state])

  // Обработка нажатия клавиатуры
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.status !== 'in_progress') return
      const key = e.key.toUpperCase()
      if (/^[А-ЯЁ]$/.test(key)) {
        setState((prev) => {
          const next = guessLetter(prev, key)
          if (next.wrongLetters.length > prev.wrongLetters.length) {
            soundManager.playGameOver()
          } else if (next.guessedLetters.length > prev.guessedLetters.length) {
            soundManager.playEat()
          }
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.status])

  const guess = useCallback((letter: string) => {
    setState((prev) => {
      if (prev.status !== 'in_progress') return prev
      const next = guessLetter(prev, letter)
      if (next.wrongLetters.length > prev.wrongLetters.length) {
        soundManager.playGameOver()
      } else if (next.guessedLetters.length > prev.guessedLetters.length) {
        soundManager.playEat()
      }
      return next
    })
  }, [])

  const restart = useCallback((difficulty?: HangmanDifficulty) => {
    setState(createHangmanState(difficulty ?? state.difficulty))
    isSavedRef.current = false
  }, [state.difficulty])

  const setDifficulty = useCallback((difficulty: HangmanDifficulty) => {
    setState(createHangmanState(difficulty))
    isSavedRef.current = false
  }, [])

  return {
    state,
    maskedWord: getMaskedWord(state),
    remainingAttempts: getRemainingAttempts(state),
    score: getHangmanScore(state),
    guess,
    restart,
    setDifficulty,
  }
}
