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

    setState(s => ({ ...s, isBotThinking: true }))

    botTimeoutRef.current = setTimeout(() => {
      setState((current) => {
        if (current.status !== 'in_progress' || current.currentPlayer !== botPlayer) {
          return { ...current, isBotThinking: false }
        }
        const move = getCheckersMove(current.board, botPlayer, current.difficulty)
        if (!move) return { ...current, isBotThinking: false }
        soundManager.playClick()
        return applyMove({ ...current, isBotThinking: false }, move)
      })
    }, delay)

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
  }, [state.currentPlayer, state.status])

  const handleCellClick = useCallback((row: number, col: number) => {
    setState((prev) => {
      if (prev.status !== 'in_progress' || prev.isBotThinking) return prev
      if (prev.currentPlayer !== prev.humanPlayer) return prev
      soundManager.playClick()
      return selectCell(prev, row, col)
    })
  }, [])

  const restart = useCallback((difficulty?: CheckersDifficulty) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState(createCheckersState(difficulty ?? state.difficulty))
    isSavedRef.current = false
  }, [state.difficulty])

  const setDifficulty = useCallback((difficulty: CheckersDifficulty) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState(createCheckersState(difficulty))
    isSavedRef.current = false
  }, [])

  const setHumanPlayer = useCallback((player: CheckersPlayer) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => ({ ...createCheckersState(prev.difficulty), humanPlayer: player }))
    isSavedRef.current = false
  }, [])

  return { state, handleCellClick, restart, setDifficulty, setHumanPlayer }
}
