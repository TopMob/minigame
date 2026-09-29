'use client'

// Сетка тайлов для Wordle — 6 строк × 5 столбцов

import { motion } from 'framer-motion'
import type { TileState } from '@/games/wordle/types'
import { WORD_LENGTH, MAX_GUESSES } from '@/games/wordle/engine'

interface WordleGridProps {
  guesses: string[][]
  tileStates: TileState[][]
  currentGuess: string[]
  currentRow: number
  revealingRow: number | null
  shake: boolean
}

const TILE_COLORS: Record<TileState, string> = {
  correct: 'bg-emerald-600 border-emerald-500 text-white shadow-xs',
  present: 'bg-amber-600 border-amber-500 text-white shadow-xs',
  absent: 'bg-zinc-800/90 border-zinc-700/60 text-zinc-400',
  filled: 'bg-card border-foreground/40 text-foreground shadow-xs',
  empty: 'bg-card/40 border-border/80 text-transparent',
}

interface TileProps {
  letter: string
  state: TileState
  delay?: number
  isRevealing?: boolean
}

function WordleTile({ letter, state, delay = 0, isRevealing = false }: TileProps) {
  const colorClass = TILE_COLORS[state]

  if (isRevealing && (state === 'correct' || state === 'present' || state === 'absent')) {
    return (
      <motion.div
        className={`
          w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center
          border-2 rounded-xl text-xl sm:text-2xl font-extrabold
          select-none ${colorClass}
        `}
        initial={{ rotateX: 0 }}
        animate={{ rotateX: [0, -90, 0] }}
        transition={{ duration: 0.5, delay, ease: 'easeInOut' }}
        style={{ perspective: 300 }}
      >
        {letter}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`
        w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center
        border-2 rounded-xl text-xl sm:text-2xl font-extrabold
        select-none ${colorClass}
      `}
      animate={
        state === 'filled'
          ? { scale: [1, 1.1, 1] }
          : {}
      }
      transition={{ duration: 0.12 }}
    >
      {letter || ''}
    </motion.div>
  )
}

export function WordleGrid({
  guesses,
  tileStates,
  currentGuess,
  currentRow,
  revealingRow,
  shake,
}: WordleGridProps) {
  return (
    <div className="flex flex-col gap-2 select-none" role="grid" aria-label="Игровое поле Wordle">
      {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
        const isCurrentRow = rowIdx === currentRow
        const isGuessed = rowIdx < currentRow
        const isRevealing = rowIdx === revealingRow

        // Данные строки
        const letters: string[] = isCurrentRow
          ? [...currentGuess, ...new Array(WORD_LENGTH - currentGuess.length).fill('')]
          : isGuessed
            ? guesses[rowIdx] || new Array(WORD_LENGTH).fill('')
            : new Array(WORD_LENGTH).fill('')

        const states: TileState[] = isCurrentRow
          ? letters.map((l) => (l ? 'filled' : 'empty'))
          : isGuessed
            ? tileStates[rowIdx] || new Array(WORD_LENGTH).fill('empty')
            : new Array(WORD_LENGTH).fill('empty')

        return (
          <motion.div
            key={rowIdx}
            className="flex gap-2"
            animate={isCurrentRow && shake ? { x: [0, -9, 9, -7, 7, -4, 4, 0] } : {}}
            transition={{ duration: 0.45 }}
          >
            {letters.map((letter, colIdx) => (
              <WordleTile
                key={colIdx}
                letter={letter}
                state={states[colIdx] || 'empty'}
                delay={isRevealing ? colIdx * 0.18 : 0}
                isRevealing={isRevealing}
              />
            ))}
          </motion.div>
        )
      })}
    </div>
  )
}
