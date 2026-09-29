'use client'

// Клавиатура для Wordle — русская раскладка ЙЦУКЕН с цветовыми подсказками

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
  correct: 'bg-emerald-600 border-emerald-500 text-white shadow-sm hover:bg-emerald-500 font-extrabold',
  present: 'bg-amber-600 border-amber-500 text-white shadow-sm hover:bg-amber-500 font-extrabold',
  absent: 'bg-zinc-800/80 border-zinc-700/50 text-zinc-500 hover:bg-zinc-800 opacity-60',
  filled: 'bg-card border-border/80 text-foreground hover:bg-accent/80',
  empty: 'bg-card/90 border-border text-foreground hover:bg-accent hover:border-foreground/20',
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
    <div className="flex flex-col items-center gap-1.5 w-full max-w-md mx-auto px-1 select-none" role="group" aria-label="Клавиатура">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1 justify-center w-full">
          {/* Enter в начале третьей строки */}
          {ri === 2 && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={onEnter}
              disabled={disabled}
              className="h-11 sm:h-12 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold uppercase tracking-wider
                bg-card border-border text-foreground hover:bg-accent hover:border-foreground/30 transition-all cursor-pointer disabled:opacity-40 shadow-xs"
            >
              Ввод
            </motion.button>
          )}

          {row.map((letter) => {
            const state = letterMap[letter] ?? 'empty'
            const colorClass = KEY_COLORS[state]

            return (
              <motion.button
                key={letter}
                whileTap={{ scale: 0.9 }}
                onClick={() => onLetter(letter)}
                disabled={disabled}
                aria-label={`Буква ${letter}`}
                className={`
                  flex-1 max-w-[34px] sm:max-w-[40px] h-11 sm:h-12 rounded-lg sm:rounded-xl border
                  text-xs sm:text-sm md:text-base font-bold
                  transition-all duration-150 cursor-pointer disabled:opacity-40 select-none shadow-xs
                  flex items-center justify-center
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
              whileTap={{ scale: 0.94 }}
              onClick={onDelete}
              disabled={disabled}
              aria-label="Удалить букву"
              className="h-11 sm:h-12 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border
                bg-card border-border text-foreground hover:bg-accent hover:border-foreground/30 transition-all cursor-pointer disabled:opacity-40 shadow-xs flex items-center justify-center"
            >
              <Delete className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      ))}
    </div>
  )
}
