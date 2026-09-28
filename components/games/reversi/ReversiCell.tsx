'use client'

import { motion } from 'framer-motion'
import type { ReversiCell as CellType, ReversiMove } from '@/games/reversi/types'

interface ReversiCellProps {
  row: number
  col: number
  value: CellType
  validMove: ReversiMove | undefined
  isLastMove: boolean
  isFlipped: boolean
  isThinking: boolean
  onMove: (r: number, c: number) => void
}

export function ReversiCell({
  row,
  col,
  value,
  validMove,
  isLastMove,
  isFlipped,
  isThinking,
  onMove,
}: ReversiCellProps) {
  const isClickable = Boolean(validMove) && !isThinking

  return (
    <button
      type="button"
      onClick={() => isClickable && onMove(row, col)}
      disabled={!isClickable && value === null}
      aria-label={`Клетка ${String.fromCharCode(65 + col)}${row + 1}`}
      className={`
        relative aspect-square w-full flex items-center justify-center
        border border-emerald-950/30 transition-all select-none
        ${isClickable ? 'cursor-pointer hover:bg-emerald-800/40' : 'cursor-default'}
      `}
    >
      {/* Фишка */}
      {value && (
        <motion.div
          key={`${row}-${col}-${value}`}
          initial={isFlipped ? { rotateY: 180, scale: 0.85 } : { scale: 0.6 }}
          animate={{ rotateY: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className={`
            relative w-[82%] h-[82%] rounded-full shadow-md transition-transform
            ${
              value === 'black'
                ? 'bg-gradient-to-br from-neutral-800 via-neutral-900 to-black border border-neutral-700/60 shadow-neutral-950/70'
                : 'bg-gradient-to-br from-white via-neutral-100 to-neutral-300 border border-neutral-300/80 shadow-black/30'
            }
          `}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Рельефный внутренний ободок фишки */}
          <div
            className={`
              absolute inset-1 rounded-full border opacity-50
              ${value === 'black' ? 'border-neutral-600' : 'border-neutral-200'}
            `}
          />

          {/* Маркер последнего сделанного хода */}
          {isLastMove && (
            <motion.div
              layoutId="last-move-indicator"
              className={`
                absolute inset-0 m-auto w-2.5 h-2.5 rounded-full
                ${value === 'black' ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}
              `}
            />
          )}
        </motion.div>
      )}

      {/* Подсказка допустимого хода */}
      {!value && validMove && (
        <div className="group relative flex items-center justify-center w-full h-full">
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-400/50 group-hover:scale-150 group-hover:bg-emerald-300/90 transition-all shadow-sm" />
          {/* Значок количества захватываемых фишек при наведении */}
          <div className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center px-1 min-w-4 h-4 rounded-full bg-amber-400 text-black text-[9px] font-black z-20 shadow-md pointer-events-none">
            +{validMove.flips.length}
          </div>
        </div>
      )}
    </button>
  )
}
