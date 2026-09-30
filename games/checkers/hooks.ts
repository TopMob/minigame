'use client'

// React-хук для игры Шашки: поддержка игры против ИИ и игры вдвоём (PvP)

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import {
  createCheckersState,
  selectCell,
  applyMove,
} from './engine'
import { getCheckersMove } from './ai'
import type { CheckersDifficulty, CheckersPlayer, CheckersState, CheckersGameMode } from './types'

export function useCheckers(initialDifficulty: CheckersDifficulty = 'medium') {
  const [state, setState] = useState<CheckersState>(() =>
    createCheckersState(initialDifficulty, 'white', 'ai')
  )
  const isSavedRef = useRef(false)
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => () => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
  }, [])

  // Сохранение результата
  useEffect(() => {
    if (state.status === 'in_progress') {
      isSavedRef.current = false
      return
    }
    if (isSavedRef.current) return
    isSavedRef.current = true

    const timeSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000))
    const isHumanWin = state.gameMode === 'pvp' ? true : state.winner === state.humanPlayer
    const isDraw = state.status === 'draw'

    if (isHumanWin && !isDraw) soundManager.playVictory()
    else if (!isDraw) soundManager.playGameOver()
    else soundManager.playDraw()

    saveGameRecord({
      gameId: 'checkers',
      difficulty: state.gameMode === 'pvp' ? 'medium' : state.difficulty,
      score: isHumanWin ? 600 : isDraw ? 150 : 0,
      timeSeconds,
      won: isHumanWin && !isDraw,
    })
  }, [state])

  // Ход бота (только для режима против ИИ)
  useEffect(() => {
    if (state.status !== 'in_progress' || state.gameMode === 'pvp') return

    const botPlayer: CheckersPlayer = state.humanPlayer === 'black' ? 'white' : 'black'
    if (state.currentPlayer !== botPlayer) return

    const delay = state.difficulty === 'hard' ? 700 : state.difficulty === 'medium' ? 500 : 350

    botTimeoutRef.current = setTimeout(() => {
      setState((current) => {
        if (
          current.status !== 'in_progress' ||
          current.gameMode === 'pvp' ||
          current.currentPlayer !== botPlayer
        ) {
          return { ...current, isBotThinking: false }
        }
        const move = getCheckersMove(current.board, botPlayer, current.difficulty, current.allMoves)
        if (!move) return { ...current, isBotThinking: false }
        soundManager.playClick()
        return applyMove({ ...current, isBotThinking: false }, move)
      })
    }, delay)

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
  }, [state.currentPlayer, state.status, state.humanPlayer, state.difficulty, state.board, state.gameMode])

  const handleCellClick = useCallback((row: number, col: number) => {
    setState((prev) => {
      if (prev.status !== 'in_progress') return prev

      if (prev.gameMode === 'ai') {
        if (prev.isBotThinking || prev.currentPlayer !== prev.humanPlayer) return prev
      }

      soundManager.playClick()
      const next = selectCell(prev, row, col)

      if (next.gameMode === 'ai') {
        const botPlayer: CheckersPlayer = next.humanPlayer === 'black' ? 'white' : 'black'
        if (next.status === 'in_progress' && next.currentPlayer === botPlayer) {
          return { ...next, isBotThinking: true }
        }
      }
      return next
    })
  }, [])

  const restart = useCallback((difficulty?: CheckersDifficulty) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => {
      const next = createCheckersState(
        difficulty ?? prev.difficulty,
        prev.humanPlayer,
        prev.gameMode
      )
      if (prev.gameMode === 'ai' && prev.humanPlayer === 'black') {
        next.isBotThinking = true
      }
      return next
    })
    isSavedRef.current = false
  }, [])

  const setDifficulty = useCallback((difficulty: CheckersDifficulty) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => {
      if (prev.difficulty === difficulty) return prev // предотвращаем лаг повторного клика
      const next = createCheckersState(difficulty, prev.humanPlayer, prev.gameMode)
      if (prev.gameMode === 'ai' && prev.humanPlayer === 'black') {
        next.isBotThinking = true
      }
      return next
    })
    isSavedRef.current = false
  }, [])

  const setHumanPlayer = useCallback((player: CheckersPlayer) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => {
      if (prev.humanPlayer === player && prev.gameMode === 'ai') return prev
      const next = createCheckersState(prev.difficulty, player, 'ai')
      if (player === 'black') {
        next.isBotThinking = true
      }
      return next
    })
    isSavedRef.current = false
  }, [])

  const setGameMode = useCallback((mode: CheckersGameMode) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => {
      if (prev.gameMode === mode) return prev
      return createCheckersState(prev.difficulty, prev.humanPlayer, mode)
    })
    isSavedRef.current = false
  }, [])

  return {
    state,
    handleCellClick,
    restart,
    setDifficulty,
    setHumanPlayer,
    setGameMode,
  }
}
