'use client'

// Игровое поле 4 в ряд — 7 колонок × 6 строк

import { motion, AnimatePresence } from 'framer-motion'
import type { Board, Connect4Player } from '@/games/connect4/types'
import { COLS, ROWS } from '@/games/connect4/types'

interface Connect4BoardProps {
  board: Board
  winningCells: [number, number][]
  currentPlayer: Connect4Player
  disabled: boolean
  onDrop: (col: number) => void
}

const PLAYER_COLORS: Record<Connect4Player, string> = {
  red: 'bg-red-500 shadow-red-500/40',
  yellow: 'bg-yellow-400 shadow-yellow-400/40',
}

const PLAYER_HOVER: Record<Connect4Player, string> = {
  red: 'hover:bg-red-500/30',
  yellow: 'hover:bg-yellow-400/30',
}

const PLAYER_INDICATOR: Record<Connect4Player, string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
}

export function Connect4Board({
  board,
  winningCells,
  currentPlayer,
  disabled,
  onDrop,
}: Connect4BoardProps) {
  const isWinningCell = (row: number, col: number) =>
    winningCells.some(([r, c]) => r === row && c === col)

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Индикаторы колонок (кнопки для хода) */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
        {Array.from({ length: COLS }, (_, col) => (
          <button
            key={col}
            onClick={() => !disabled && onDrop(col)}
            disabled={disabled}
            aria-label={`Бросить в колонку ${col + 1}`}
            className={`
              w-10 h-7 sm:w-12 sm:h-8 rounded-lg flex items-center justify-center
              transition-colors duration-150 cursor-pointer disabled:cursor-default
              ${disabled ? 'opacity-0' : PLAYER_HOVER[currentPlayer]}
            `}
          >
            {!disabled && (
              <div className={`w-3 h-3 rounded-full ${PLAYER_INDICATOR[currentPlayer]} opacity-60`} />
            )}
          </button>
        ))}
      </div>

      {/* Поле */}
      <div
        className="bg-blue-700 dark:bg-blue-900 rounded-2xl p-2 sm:p-3 shadow-2xl"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '6px' }}
      >
        {Array.from({ length: ROWS }, (_, row) =>
          Array.from({ length: COLS }, (_, col) => {
            const cell = board[row][col]
            const isWin = isWinningCell(row, col)

            return (
              <div
                key={`${row}-${col}`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-900/70 dark:bg-slate-900/80 flex items-center justify-center"
              >
                <AnimatePresence>
                  {cell && (
                    <motion.div
                      key={`piece-${row}-${col}`}
                      className={`
                        w-9 h-9 sm:w-11 sm:h-11 rounded-full shadow-lg
                        ${PLAYER_COLORS[cell]}
                        ${isWin ? 'ring-4 ring-white/70 ring-offset-1 ring-offset-blue-800' : ''}
                      `}
                      initial={{ y: -200, opacity: 0.7 }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        scale: isWin ? [1, 1.15, 1] : 1,
                      }}
                      transition={{
                        y: { type: 'spring', stiffness: 400, damping: 28, mass: 0.8 },
                        scale: isWin
                          ? { delay: 0.3, duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }
                          : {},
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
