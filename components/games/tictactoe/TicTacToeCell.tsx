'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { CellValue } from '@/games/tictactoe/types'

interface TicTacToeCellProps {
  index: number
  value: CellValue
  isWinning: boolean
  disabled: boolean
  isFocused: boolean
  onClick: () => void
  onFocus: () => void
}

export const TicTacToeCell = React.memo(function TicTacToeCell({
  index,
  value,
  isWinning,
  disabled,
  isFocused,
  onClick,
  onFocus,
}: TicTacToeCellProps) {
  const cellNumber = index + 1
  const label = value ? `Клетка ${cellNumber}: ${value === 'X' ? 'крестик' : 'нолик'}` : `Клетка ${cellNumber}, пустая`

  return (
    <button
      type="button"
      role="gridcell"
      aria-label={label}
      tabIndex={isFocused ? 0 : -1}
      disabled={disabled || value !== null}
      onClick={onClick}
      onFocus={onFocus}
      className={`
        relative aspect-square w-full rounded-2xl flex items-center justify-center
        border-2 transition-colors duration-150 select-none
        focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2
        ${isWinning
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border bg-card/60 hover:bg-accent/40 active:bg-accent/60'
        }
        ${!value && !disabled ? 'cursor-pointer' : ''}
        ${value !== null ? 'cursor-default' : ''}
      `}
    >
      {value === 'X' && (
        <motion.svg
          initial={{ scale: 0, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="w-3/5 h-3/5 text-sky-600 dark:text-sky-400 stroke-current"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </motion.svg>
      )}

      {value === 'O' && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="w-3/5 h-3/5 text-rose-600 dark:text-rose-400 stroke-current"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="8" />
        </motion.svg>
      )}
    </button>
  )
})
