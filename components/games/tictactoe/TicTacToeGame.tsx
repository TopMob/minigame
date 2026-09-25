'use client'

import React from 'react'
import { Confetti } from '@/components/games/Confetti'
import { useTicTacToe } from '@/games/tictactoe/hooks'
import { TicTacToeBoard } from './TicTacToeBoard'
import { TicTacToeControls } from './TicTacToeControls'
import { TicTacToeScore } from './TicTacToeScore'

export function TicTacToeGame() {
  const {
    state,
    makeMove,
    resetGame,
    setMode,
    setDifficulty,
    setPlayerSign,
  } = useTicTacToe()

  const isUserWinner =
    state.status === 'won' &&
    (state.mode === 'pvp-local' || state.winner === state.playerSign)

  return (
    <div className="relative flex flex-col items-center w-full max-w-md mx-auto px-4 py-2 space-y-6">
      {isUserWinner && <Confetti />}

      {/* Заголовок */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Крестики-нолики</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Классическая битва умов. Играйте против умного бота или вдвоём на одном экране.
        </p>
      </div>

      {/* Табло счета и текущего статуса */}
      <TicTacToeScore
        scores={state.scores}
        turn={state.turn}
        status={state.status}
        winner={state.winner}
        mode={state.mode}
        playerSign={state.playerSign}
        isBotThinking={state.isBotThinking}
      />

      {/* Игровое поле 3х3 */}
      <TicTacToeBoard
        board={state.board}
        winningLine={state.winningLine}
        disabled={state.status !== 'in_progress' || state.isBotThinking}
        onCellClick={makeMove}
      />

      {/* Подсказка по клавиатурному управлению */}
      <div className="hidden sm:block text-[11px] text-muted-foreground/80 text-center">
        Подсказка: навигация стрелками или клавишами 1-9, ход: Пробел или Enter
      </div>

      {/* Панель управления и настроек */}
      <TicTacToeControls
        mode={state.mode}
        difficulty={state.difficulty}
        playerSign={state.playerSign}
        onModeChange={setMode}
        onDifficultyChange={setDifficulty}
        onSignChange={setPlayerSign}
        onRestart={resetGame}
      />
    </div>
  )
}
