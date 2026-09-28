'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import { getBotMove } from './ai'
import { applyMove, createInitialState, resetGame, undoMove } from './engine'
import type {
  ReversiDifficulty,
  ReversiMode,
  ReversiPlayer,
  ReversiState,
} from './types'

export function useReversi(
  initialMode: ReversiMode = 'vs-bot',
  initialDifficulty: ReversiDifficulty = 'medium',
  initialHumanPlayer: ReversiPlayer = 'black'
) {
  const [state, setState] = useState<ReversiState>(() =>
    createInitialState(initialMode, initialDifficulty, initialHumanPlayer)
  )

  const isSavedRef = useRef(false)
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
  }, [])

  // Звуковое оповещение о пропуске хода
  useEffect(() => {
    if (state.passMessage) {
      soundManager.playReversiPass()
    }
  }, [state.passMessage])

  // Сохранение рекордов и окончание игры
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
      if (isHumanWin) {
        soundManager.playVictory()
      } else if (!isDraw) {
        soundManager.playGameOver()
      } else {
        soundManager.playDraw()
      }

      const diffMultiplier =
        state.difficulty === 'hard' ? 3 : state.difficulty === 'medium' ? 2 : 1
      const userPieces = state.pieces[state.humanPlayer]
      const botPieces =
        state.pieces[state.humanPlayer === 'black' ? 'white' : 'black']
      const pieceAdvantage = Math.max(0, userPieces - botPieces)
      const calculatedScore = isHumanWin
        ? 500 + pieceAdvantage * 20 * diffMultiplier
        : isDraw
        ? 150
        : Math.max(0, userPieces * 10)

      saveGameRecord({
        gameId: 'reversi',
        difficulty: state.difficulty,
        score: calculatedScore,
        timeSeconds,
        won: isHumanWin,
      })
    } else {
      // Локальный PvP
      if (state.winner) {
        soundManager.playVictory()
      } else {
        soundManager.playDraw()
      }
    }
  }, [state])

  // Ход бота
  useEffect(() => {
    if (state.mode !== 'vs-bot') return
    if (state.status !== 'in_progress') return

    const botPlayer: ReversiPlayer =
      state.humanPlayer === 'black' ? 'white' : 'black'

    if (state.currentPlayer !== botPlayer) return

    const delay =
      state.difficulty === 'hard' ? 700 : state.difficulty === 'medium' ? 550 : 400

    botTimeoutRef.current = setTimeout(() => {
      setState((current) => {
        if (current.status !== 'in_progress' || current.currentPlayer !== botPlayer) {
          return { ...current, isBotThinking: false }
        }

        const botMove = getBotMove(current.board, botPlayer, current.difficulty)
        if (!botMove) return { ...current, isBotThinking: false }

        // Звуки хода
        soundManager.playReversiPlace()
        botMove.flips.forEach((_, idx) => {
          soundManager.playReversiFlip(idx)
        })

        const next = applyMove(current, botMove.row, botMove.col)
        return { ...next, isBotThinking: false }
      })
    }, delay)

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
  }, [state.currentPlayer, state.status, state.mode, state.humanPlayer, state.difficulty])

  // Клик игрока по клетке
  const makeMove = useCallback(
    (row: number, col: number) => {
      setState((prev) => {
        if (prev.status !== 'in_progress' || prev.isBotThinking) return prev
        if (prev.mode === 'vs-bot' && prev.currentPlayer !== prev.humanPlayer) {
          return prev
        }

        const isValid = prev.validMoves.some((m) => m.row === row && m.col === col)
        if (!isValid) return prev

        const move = prev.validMoves.find((m) => m.row === row && m.col === col)
        soundManager.playReversiPlace()
        move?.flips.forEach((_, idx) => {
          soundManager.playReversiFlip(idx)
        })

        const next = applyMove(prev, row, col)
        const botPlayer: ReversiPlayer = next.humanPlayer === 'black' ? 'white' : 'black'
        if (next.mode === 'vs-bot' && next.status === 'in_progress' && next.currentPlayer === botPlayer) {
          return { ...next, isBotThinking: true }
        }
        return next
      })
    },
    []
  )

  const restart = useCallback(() => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => resetGame(prev))
    isSavedRef.current = false
  }, [])

  const undo = useCallback(() => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    setState((prev) => undoMove(prev))
  }, [])

  const setDifficulty = useCallback((diff: ReversiDifficulty) => {
    setState((prev) => {
      if (prev.difficulty === diff) return prev
      const next = createInitialState(prev.mode, diff, prev.humanPlayer)
      next.scores = prev.scores
      return next
    })
    isSavedRef.current = false
  }, [])

  const setMode = useCallback((mode: ReversiMode) => {
    setState((prev) => {
      if (prev.mode === mode) return prev
      const next = createInitialState(mode, prev.difficulty, prev.humanPlayer)
      next.scores = { black: 0, white: 0 }
      return next
    })
    isSavedRef.current = false
  }, [])

  const setHumanPlayer = useCallback((player: ReversiPlayer) => {
    setState((prev) => {
      if (prev.humanPlayer === player) return prev
      const next = createInitialState(prev.mode, prev.difficulty, player)
      next.scores = prev.scores
      if (prev.mode === 'vs-bot' && player === 'white') {
        next.isBotThinking = true
      }
      return next
    })
    isSavedRef.current = false
  }, [])

  return {
    state,
    makeMove,
    restart,
    undo,
    setDifficulty,
    setMode,
    setHumanPlayer,
  }
}
