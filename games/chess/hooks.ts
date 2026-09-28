'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import {
  createInitialChessState,
  executeMove,
  getValidMovesForSquare,
  isPawnPromotion,
  undoLastMove,
} from './engine'
import { getBestMove } from './ai'
import type {
  ChessColor,
  ChessDifficulty,
  ChessState,
  GameMode,
  PieceType,
} from './types'
import { PieceSymbol } from 'chess.js'

export function useChess(
  initialDifficulty: ChessDifficulty = 'medium',
  initialMode: GameMode = 'ai',
  initialColor: ChessColor = 'w'
) {
  const [state, setState] = useState<ChessState>(() =>
    createInitialChessState(initialDifficulty, initialMode, initialColor)
  )

  const isSavedRef = useRef(false)
  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
  }, [])

  // Сохранение рекорда при завершении игры
  useEffect(() => {
    if (state.status === 'in_progress') {
      isSavedRef.current = false
      return
    }

    if (isSavedRef.current) return
    isSavedRef.current = true

    const timeSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000))
    const isHumanWin = state.gameMode === 'ai' && state.winner === state.playerColor
    const isDraw = state.winner === 'draw'

    if (isHumanWin) {
      soundManager.playVictory()
    } else if (isDraw) {
      soundManager.playDraw()
    } else {
      soundManager.playGameOver()
    }

    const scoreMultiplier =
      state.difficulty === 'expert' ? 1000 : state.difficulty === 'hard' ? 700 : state.difficulty === 'medium' ? 450 : 250

    saveGameRecord({
      gameId: 'chess',
      difficulty: state.difficulty,
      score: isHumanWin ? scoreMultiplier : isDraw ? Math.round(scoreMultiplier / 3) : 0,
      timeSeconds,
      won: isHumanWin,
    })
  }, [state])

  // Внутренняя функция совершения хода с воспроизведением звука
  const applyMoveInternal = useCallback(
    (from: string, to: string, promotion: PieceSymbol = 'q') => {
      setState((prev) => {
        const { nextState, isSuccess, isCapture, isCheck } = executeMove(
          prev,
          from,
          to,
          promotion
        )

        if (!isSuccess) return prev

        if (isCheck) {
          soundManager.playChessCheck()
        } else if (isCapture) {
          soundManager.playCapture()
        } else {
          soundManager.playChessMove()
        }

        const isBotTurnNext =
          nextState.gameMode === 'ai' &&
          nextState.status === 'in_progress' &&
          nextState.turn !== nextState.playerColor

        return { ...nextState, isBotThinking: isBotTurnNext }
      })
    },
    []
  )

  // Обработка клика по клетке
  const handleSquareClick = useCallback(
    (square: string) => {
      if (state.status !== 'in_progress') return
      if (state.pendingPromotion) return

      // Если ход бота — клики заблокированы
      if (state.gameMode === 'ai' && state.turn !== state.playerColor) return

      // Если клетка уже была выбрана и кликнули по допустимому ходу
      if (state.selectedSquare && state.validMoves.includes(square)) {
        if (isPawnPromotion(state.fen, state.selectedSquare, square)) {
          setState((prev) => ({
            ...prev,
            pendingPromotion: { from: prev.selectedSquare!, to: square },
          }))
          return
        }

        applyMoveInternal(state.selectedSquare, square, 'q')
        return
      }

      // Выбор новой фигуры
      const validMoves = getValidMovesForSquare(state.fen, square)
      if (validMoves.length > 0) {
        soundManager.playClick()
        setState((prev) => ({
          ...prev,
          selectedSquare: square,
          validMoves,
        }))
      } else {
        // Сброс выбора
        setState((prev) => ({
          ...prev,
          selectedSquare: null,
          validMoves: [],
        }))
      }
    },
    [state, applyMoveInternal]
  )

  // Выбор фигуры при превращении пешки
  const handlePromotionSelect = useCallback(
    (piece: PieceType) => {
      if (!state.pendingPromotion) return
      const { from, to } = state.pendingPromotion
      applyMoveInternal(from, to, piece as PieceSymbol)
    },
    [state.pendingPromotion, applyMoveInternal]
  )

  // Отмена превращения
  const cancelPromotion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingPromotion: null,
      selectedSquare: null,
      validMoves: [],
    }))
  }, [])

  // Ход бота в режиме против ИИ
  useEffect(() => {
    if (state.status !== 'in_progress') return
    if (state.gameMode !== 'ai') return
    if (state.turn === state.playerColor) return

    const delay =
      state.difficulty === 'expert' ? 700 : state.difficulty === 'hard' ? 550 : 400

    botTimeoutRef.current = setTimeout(() => {
      const bestMove = getBestMove(state.fen, state.difficulty)

      if (bestMove) {
        applyMoveInternal(bestMove.from, bestMove.to, (bestMove.promotion || 'q') as PieceSymbol)
      } else {
        setState((prev) => ({ ...prev, isBotThinking: false }))
      }
    }, delay)

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    }
  }, [state.fen, state.turn, state.status, state.gameMode, state.playerColor, state.difficulty, applyMoveInternal])

  // Новая игра
  const restart = useCallback(
    (
      newDiff?: ChessDifficulty,
      newMode?: GameMode,
      newColor?: ChessColor
    ) => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
      isSavedRef.current = false
      const targetDiff = newDiff ?? state.difficulty
      const targetMode = newMode ?? state.gameMode
      const targetColor = newColor ?? state.playerColor
      const next = createInitialChessState(targetDiff, targetMode, targetColor)
      if (targetMode === 'ai' && targetColor === 'b') {
        next.isBotThinking = true
      }
      setState(next)
    },
    [state.difficulty, state.gameMode, state.playerColor]
  )

  // Отмена хода
  const undo = useCallback(() => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current)
    soundManager.playClick()
    setState((prev) => undoLastMove(prev))
  }, [])

  return {
    state,
    handleSquareClick,
    handlePromotionSelect,
    cancelPromotion,
    restart,
    undo,
  }
}
