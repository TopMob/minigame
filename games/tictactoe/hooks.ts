'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import { getBotMove } from './ai'
import { ticTacToeEngine } from './engine'
import type { Difficulty, GameMode, Player, TicTacToeState } from './types'

export function useTicTacToe(initialMode: GameMode = 'vs-bot') {
  const [state, setState] = useState<TicTacToeState>(() =>
    ticTacToeEngine.createInitialState({ mode: initialMode, difficulty: 'medium', playerSign: 'X' })
  )

  const botTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavedRef = useRef<boolean>(false)

  // Очистка таймера бота при анмаунте
  useEffect(() => {
    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current)
      }
    }
  }, [])

  // Обработка окончания игры и сохранение рекорда
  useEffect(() => {
    if (state.status === 'in_progress') {
      isSavedRef.current = false
      return
    }

    if (isSavedRef.current) return
    isSavedRef.current = true

    const timeSeconds = state.startTime ? Math.max(1, Math.round((Date.now() - state.startTime) / 1000)) : 1
    const isHumanWin = state.mode === 'vs-bot' && state.winner === state.playerSign
    const isBotWin = state.mode === 'vs-bot' && state.winner !== null && state.winner !== state.playerSign
    const isDraw = state.status === 'draw'

    if (state.mode === 'vs-bot') {
      if (isHumanWin) {
        soundManager.playVictory()
      } else if (isBotWin) {
        soundManager.playGameOver()
      } else if (isDraw) {
        soundManager.playDraw()
      }

      // Сохраняем в историю и статистику
      saveGameRecord({
        gameId: 'tictactoe',
        difficulty: state.difficulty,
        score: ticTacToeEngine.getScore(state),
        timeSeconds,
        won: isHumanWin,
      })
    } else {
      // Режим вдвоём
      if (state.winner) {
        soundManager.playVictory()
      } else {
        soundManager.playDraw()
      }
    }
  }, [state])

  // Реакция на ход бота
  useEffect(() => {
    if (state.mode !== 'vs-bot' || state.status !== 'in_progress') return

    const botSign: Player = state.playerSign === 'X' ? 'O' : 'X'

    // Если сейчас ход бота
    if (state.turn !== botSign) return

    // Человекоподобная задержка 350-500мс
    const delay = Math.floor(Math.random() * 150) + 350

    botTimeoutRef.current = setTimeout(() => {
      setState((current) => {
        if (current.status !== 'in_progress' || current.turn !== botSign) return current

        const botMoveIndex = getBotMove(current.board, botSign, current.difficulty)
        if (botMoveIndex >= 0) {
          soundManager.playClick()
          return ticTacToeEngine.applyAction(current, { type: 'BOT_MOVE', index: botMoveIndex })
        }
        return current
      })
    }, delay)

    return () => {
      if (botTimeoutRef.current) {
        clearTimeout(botTimeoutRef.current)
      }
    }
  }, [state.turn, state.mode, state.playerSign, state.status])

  // Совершение хода игроком
  const makeMove = useCallback(
    (index: number) => {
      if (state.status !== 'in_progress' || state.isBotThinking) return
      if (state.board[index] !== null) return

      // В режиме против бота разрешаем ход только если ход игрока
      if (state.mode === 'vs-bot' && state.turn !== state.playerSign) return

      soundManager.playClick()
      setState((prev) => ticTacToeEngine.applyAction(prev, { type: 'MAKE_MOVE', index }))
    },
    [state.status, state.isBotThinking, state.board, state.mode, state.turn, state.playerSign]
  )

  const resetGame = useCallback(() => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current)
    }
    setState((prev) => ticTacToeEngine.applyAction(prev, { type: 'RESET_GAME' }))
  }, [])

  const setMode = useCallback((mode: GameMode) => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current)
    }
    setState((prev) => ticTacToeEngine.applyAction(prev, { type: 'SET_MODE', mode }))
  }, [])

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState((prev) => ticTacToeEngine.applyAction(prev, { type: 'SET_DIFFICULTY', difficulty }))
  }, [])

  const setPlayerSign = useCallback((sign: Player) => {
    if (botTimeoutRef.current) {
      clearTimeout(botTimeoutRef.current)
    }
    setState((prev) => ticTacToeEngine.applyAction(prev, { type: 'SET_PLAYER_SIGN', sign }))
  }, [])

  return {
    state,
    makeMove,
    resetGame,
    setMode,
    setDifficulty,
    setPlayerSign,
  }
}
