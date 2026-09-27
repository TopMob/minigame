'use client'

// Клавиатура для Словоцепи — русская раскладка ЙЦУКЕН с цветовыми подсказками

import { motion } from 'framer-motion'
import { Delete } from 'lucide-react'
import type { TileState } from '@/games/wordle/types'

interface WordleKeyboardProps {
  rows: string[][]
  letterMap: Record<string, TileState>
  disabled: boolean
  onLetter: (letter: string) => void
  onDelete: () => void
  onEnter: () => void
}

const KEY_COLORS: Record<TileState, string> = {
  correct: 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600',
  present: 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600',
  absent: 'bg-muted/80 border-muted-foreground/20 text-muted-foreground hover:bg-muted',
  filled: 'bg-card border-border text-foreground hover:bg-accent',
  empty: 'bg-card border-border text-foreground hover:bg-accent',
}

export function WordleKeyboard({
  rows,
  letterMap,
  disabled,
  onLetter,
  onDelete,
  onEnter,
}: WordleKeyboardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5" role="group" aria-label="Клавиатура">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1">
          {/* Enter в начале третьей строки */}
          {ri === 2 && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onEnter}
              disabled={disabled}
              className="h-12 px-2 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-bold uppercase tracking-wide
                bg-card border-border text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-40"
            >
              ↵ Enter
            </motion.button>
          )}

          {row.map((letter) => {
            const state = letterMap[letter] ?? 'empty'
            const colorClass = KEY_COLORS[state]

            return (
              <motion.button
                key={letter}
                whileTap={{ scale: 0.88 }}
                onClick={() => onLetter(letter)}
                disabled={disabled}
                aria-label={`Буква ${letter}`}
                className={`
                  h-12 w-9 sm:w-10 rounded-xl border text-sm sm:text-base font-bold
                  transition-colors cursor-pointer disabled:opacity-40 select-none
                  ${colorClass}
                `}
              >
                {letter}
              </motion.button>
            )
          })}

          {/* Backspace в конце третьей строки */}
          {ri === 2 && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onDelete}
              disabled={disabled}
              aria-label="Удалить последнюю букву"
              className="h-12 px-2 sm:px-3 rounded-xl border
                bg-card border-border text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-40"
            >
              <Delete className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      ))}
    </div>
  )
}
