'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import {
  createCheckersState,
  selectCell,
  applyMove,
} from './engine'
import { getCheckersMove } from './ai'
import type { CheckersDifficulty, CheckersPlayer, CheckersState } from './types'

export function useCheckers(initialDifficulty: CheckersDifficulty = 'medium') {
  const [state, setState] = useState<CheckersState>(() =>
    createCheckersState(initialDifficulty)
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
    const isHumanWin = state.winner === state.humanPlayer
    const isDraw = state.status === 'draw'

    if (isHumanWin) soundManager.playVictory()
    else if (!isDraw) soundManager.playGameOver()
    else soundManager.playDraw()

    saveGameRecord({
      gameId: 'checkers',
      difficulty: state.difficulty,
      score: isHumanWin ? 600 : isDraw ? 150 : 0,
      timeSeconds,
      won: isHumanWin,
    })
  }, [state])

  // Ход бота
  useEffect(() => {
    if (state.status !== 'in_progress') return

    const botPlayer: CheckersPlayer = state.humanPlayer === 'black' ? 'white' : 'black'
    if (state.currentPlayer !== botPlayer) return

    const delay = state.difficulty === 'hard' ? 900 : state.difficulty === 'medium' ? 600 : 400

    botTimeoutRef.current = setTimeout(() => {
      setState((current) => {
        if (current.status !== 'in_progress' || current.currentPlayer !== botPlayer) {
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
  }, [state.currentPlayer, state.status, state.humanPlayer, state.difficulty, state.board])

  const handleCellClick = useCallback((row: number, col: number) => {
    setState((prev) => {
      if (prev.status !== 'in_progress' || prev.isBotThinking) return prev
      if (prev.currentPlayer !== prev.humanPlayer) return prev
      soundManager.playClick()
      const next = selectCell(prev, row, col)
      const botPlayer: CheckersPlayer = next.humanPlayer === 'black' ? 'white' : 'black'
      if (next.status === 'in_progress' && next.currentPlayer === botPlayer) {
        return { ...next, isBotThinking: true }
      }
      return next
    })
  }, [])

  const restart = useCallback((difficulty?: CheckersDifficulty) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => {
      const next = createCheckersState(difficulty ?? prev.difficulty, prev.humanPlayer)
      if (prev.humanPlayer === 'black') {
        next.isBotThinking = true
      }
      return next
    })
    isSavedRef.current = false
  }, [])

  const setDifficulty = useCallback((difficulty: CheckersDifficulty) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => {
      const next = createCheckersState(difficulty, prev.humanPlayer)
      if (prev.humanPlayer === 'black') {
        next.isBotThinking = true
      }
      return next
    })
    isSavedRef.current = false
  }, [])

  const setHumanPlayer = useCallback((player: CheckersPlayer) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => {
      const next = createCheckersState(prev.difficulty, player)
      if (player === 'black') {
        next.isBotThinking = true
      }
      return next
    })
    isSavedRef.current = false
  }, [])

  return { state, handleCellClick, restart, setDifficulty, setHumanPlayer }
}
