'use client'

// Цифровая клавиатура для Судоку

import { cn } from '@/lib/utils'
import type { Digit } from '@/games/sudoku/types'

interface SudokuNumpadProps {
  onDigit: (digit: Digit) => void
  onErase: () => void
  digitCounts: Record<number, number> // сколько раз каждая цифра уже на поле
  disabled: boolean
}

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

export function SudokuNumpad({ onDigit, onErase, digitCounts, disabled }: SudokuNumpadProps) {
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full max-w-[450px]">
      {DIGITS.map((d) => {
        const isComplete = (digitCounts[d] ?? 0) >= 9
        return (
          <button
            key={d}
            type="button"
            disabled={disabled || isComplete}
            onClick={() => onDigit(d)}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border border-border',
              'py-2 sm:py-3 text-lg sm:text-xl font-semibold transition-colors',
              'hover:bg-accent/20 active:bg-accent/30',
              'focus:outline-none focus:ring-2 focus:ring-accent/50',
              'disabled:opacity-30 disabled:cursor-not-allowed',
            )}
          >
            {d}
            <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
              {9 - (digitCounts[d] ?? 0)}
            </span>
          </button>
        )
      })}
      <button
        type="button"
        disabled={disabled}
        onClick={onErase}
        className={cn(
          'flex items-center justify-center rounded-lg border border-border',
          'py-2 sm:py-3 text-sm sm:text-base font-medium transition-colors',
          'hover:bg-red-500/10 active:bg-red-500/20 text-red-500',
          'focus:outline-none focus:ring-2 focus:ring-red-500/50',
          'disabled:opacity-30 disabled:cursor-not-allowed',
        )}
        aria-label="Стереть"
      >
        ✕
      </button>
    </div>
  )
}
