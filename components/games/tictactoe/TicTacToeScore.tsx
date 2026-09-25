'use client'

import React from 'react'
import type { GameMode, GameStatus, Player, ScoreBoard } from '@/games/tictactoe/types'

interface TicTacToeScoreProps {
  scores: ScoreBoard
  turn: Player
  status: GameStatus
  winner: Player | null
  mode: GameMode
  playerSign: Player
  isBotThinking: boolean
}

export function TicTacToeScore({
  scores,
  turn,
  status,
  winner,
  mode,
  playerSign,
  isBotThinking,
}: TicTacToeScoreProps) {
  const isBotO = mode === 'vs-bot' && playerSign === 'X'
  const isBotX = mode === 'vs-bot' && playerSign === 'O'

  const labelX = isBotX ? 'Бот (X)' : mode === 'vs-bot' ? 'Вы (X)' : 'Игрок 1 (X)'
  const labelO = isBotO ? 'Бот (O)' : mode === 'vs-bot' ? 'Вы (O)' : 'Игрок 2 (O)'

  let statusText = ''
  if (status === 'won') {
    if (mode === 'vs-bot') {
      statusText = winner === playerSign ? 'Вы победили!' : 'Бот победил!'
    } else {
      statusText = winner === 'X' ? 'Победили Крестики!' : 'Победили Нолики!'
    }
  } else if (status === 'draw') {
    statusText = 'Ничья в партии'
  } else if (isBotThinking) {
    statusText = 'Бот обдумывает ход...'
  } else {
    statusText = turn === 'X' ? `Ходят ${labelX}` : `Ходят ${labelO}`
  }

  return (
    <div className="w-full max-w-[340px] sm:max-w-[380px] space-y-3">
      {/* Счётчик */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div
          className={`p-2.5 rounded-2xl border transition-all duration-150 ${
            turn === 'X' && status === 'in_progress'
              ? 'border-sky-500/60 bg-sky-500/10'
              : 'border-border bg-card/60'
          }`}
        >
          <div className="text-xs text-muted-foreground truncate">{labelX}</div>
          <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {scores.x}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl border border-border bg-card/60">
          <div className="text-xs text-muted-foreground">Ничьи</div>
          <div className="text-xl font-bold font-mono text-foreground">{scores.draws}</div>
        </div>

        <div
          className={`p-2.5 rounded-2xl border transition-all duration-150 ${
            turn === 'O' && status === 'in_progress'
              ? 'border-rose-500/60 bg-rose-500/10'
              : 'border-border bg-card/60'
          }`}
        >
          <div className="text-xs text-muted-foreground truncate">{labelO}</div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {scores.o}
          </div>
        </div>
      </div>

      {/* Статусная строка */}
      <div className="text-center py-1">
        <span
          className={`text-sm font-semibold tracking-wide transition-opacity duration-200 ${
            isBotThinking ? 'animate-pulse text-muted-foreground' : 'text-foreground'
          }`}
        >
          {statusText}
        </span>
      </div>
    </div>
  )
}
