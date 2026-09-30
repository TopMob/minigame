'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import {
  createMemoryState,
  flipCard,
  hideUnmatched,
  getMemoryScore,
  getGridConfig,
} from './engine'
import type { MemoryDifficulty, MemoryState } from './types'

const HIDE_DELAY_MS = 900 // время на запоминание несовпавших карточек

export function useMemory(initialDifficulty: MemoryDifficulty = 'medium') {
  const [state, setState] = useState<MemoryState>(() =>
    createMemoryState(initialDifficulty)
  )
  const isSavedRef = useRef(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Очистка таймера
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [])

  // Сохранение результата
  useEffect(() => {
    if (state.status !== 'won') {
      isSavedRef.current = false
      return
    }
    if (isSavedRef.current) return
    isSavedRef.current = true

    soundManager.playVictory()

    const timeSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000))
    saveGameRecord({
      gameId: 'memory',
      difficulty: state.difficulty,
      score: getMemoryScore(state),
      timeSeconds,
      won: true,
    })
  }, [state])

  const handleFlip = useCallback((cardId: number) => {
    setState((prev) => {
      const next = flipCard(prev, cardId)

      if (next.cards === prev.cards) return prev // ничего не изменилось

      // Совпадение
      if (next.flippedIds.length === 0 && next.matchedPairs > prev.matchedPairs) {
        soundManager.playBonus()
        return next
      }

      // Кликнули первую карточку
      if (next.flippedIds.length === 1) {
        soundManager.playClick()
        return next
      }

      // Кликнули вторую — не совпадение (isChecking=true)
      if (next.isChecking) {
        soundManager.playGameOver()
        // Скрываем через HIDE_DELAY_MS
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = setTimeout(() => {
          setState((s) => hideUnmatched(s))
        }, HIDE_DELAY_MS)
      }

      return next
    })
  }, [])

  const restart = useCallback((difficulty?: MemoryDifficulty) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    setState(createMemoryState(difficulty ?? state.difficulty))
    isSavedRef.current = false
  }, [state.difficulty])

  const setDifficulty = useCallback((difficulty: MemoryDifficulty) => {
    setState((prev) => {
      if (prev.difficulty === difficulty) return prev
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      return createMemoryState(difficulty)
    })
    isSavedRef.current = false
  }, [])

  return {
    state,
    gridConfig: getGridConfig(state.difficulty),
    score: getMemoryScore(state),
    handleFlip,
    restart,
    setDifficulty,
  }
}
