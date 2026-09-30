'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import {
  createConnect4State,
  applyPlayerMove,
  resetConnect4,
} from './engine'
import { getBotMove } from './ai'
import type { Connect4Difficulty, Connect4Mode, Connect4Player, Connect4State } from './types'

export function useConnect4(
  initialMode: Connect4Mode = 'vs-bot',
  initialDifficulty: Connect4Difficulty = 'medium'
) {
  const [state, setState] = useState<Connect4State>(() =>
    createConnect4State(initialMode, initialDifficulty)
  )
  const isSavedRef = useRef(false)
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
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
    const isHumanWin = state.mode === 'vs-bot' && state.winner === state.humanPlayer
    const isDraw = state.status === 'draw'

    if (state.mode === 'vs-bot') {
      if (isHumanWin) soundManager.playVictory()
      else if (!isDraw) soundManager.playGameOver()
      else soundManager.playDraw()

      saveGameRecord({
        gameId: 'connect4',
        difficulty: state.difficulty,
        score: isHumanWin ? 500 : isDraw ? 100 : 0,
        timeSeconds,
        won: isHumanWin,
      })
    } else {
      if (state.winner) soundManager.playVictory()
      else soundManager.playDraw()
    }
  }, [state])

  // Ход бота
  useEffect(() => {
    if (state.mode !== 'vs-bot') return
    if (state.status !== 'in_progress') return

    const botPlayer: Connect4Player = state.humanPlayer === 'red' ? 'yellow' : 'red'
    if (state.currentPlayer !== botPlayer) return

    const delay = state.difficulty === 'hard' ? 800 : state.difficulty === 'medium' ? 500 : 350

    botTimeoutRef.current = setTimeout(() => {
      const current = state
      if (current.status !== 'in_progress' || current.currentPlayer !== botPlayer) return
      const botCol = getBotMove(current.board, botPlayer, current.difficulty)
      if (botCol === -1) return
      soundManager.playDrop()
      setState((prev) => {
        if (prev.status !== 'in_progress' || prev.currentPlayer !== botPlayer) {
          return { ...prev, isBotThinking: false }
        }
        return applyPlayerMove({ ...prev, isBotThinking: false }, botCol)
      })
    }, delay)

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
  }, [state.currentPlayer, state.status, state.mode, state.humanPlayer, state.difficulty])

  const drop = useCallback((col: number) => {
    setState((prev) => {
      if (prev.status !== 'in_progress' || prev.isBotThinking) return prev
      if (prev.mode === 'vs-bot' && prev.currentPlayer !== prev.humanPlayer) return prev
      soundManager.playDrop()
      const next = applyPlayerMove(prev, col)
      if (next.mode === 'vs-bot' && next.status === 'in_progress' && next.currentPlayer !== next.humanPlayer) {
        return { ...next, isBotThinking: true }
      }
      return next
    })
  }, [])

  const resetGame = useCallback(() => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => resetConnect4(prev))
    isSavedRef.current = false
  }, [])

  const setMode = useCallback((mode: Connect4Mode) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => ({ ...createConnect4State(mode, prev.difficulty), scores: prev.scores }))
    isSavedRef.current = false
  }, [])

  const setDifficulty = useCallback((difficulty: Connect4Difficulty) => {
    setState((prev) => {
      if (prev.difficulty === difficulty) return prev
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
      return { ...createConnect4State(prev.mode, difficulty), scores: prev.scores }
    })
    isSavedRef.current = false
  }, [])

  const setHumanPlayer = useCallback((player: Connect4Player) => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => ({
      ...createConnect4State(prev.mode, prev.difficulty),
      scores: prev.scores,
      humanPlayer: player,
      currentPlayer: 'red',
    }))
    isSavedRef.current = false
  }, [])

  return { state, drop, resetGame, setMode, setDifficulty, setHumanPlayer }
}
