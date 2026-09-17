'use client'

// Компонент плитки 2048 с адаптивным стилем и плавными анимациями

import { motion } from 'framer-motion'
import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { Tile } from '@/games/2048/types'

interface TileProps {
  tile: Tile
  cellSizePercent: number
  gapPercent: number
}

const TILE_CLASSES: Record<number, string> = {
  2: 'bg-amber-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100',
  4: 'bg-amber-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100',
  8: 'bg-orange-500 text-white',
  16: 'bg-orange-600 text-white',
  32: 'bg-amber-600 text-white',
  64: 'bg-red-500 text-white',
  128: 'bg-yellow-400 text-zinc-950 font-bold',
  256: 'bg-yellow-500 text-zinc-950 font-bold',
  512: 'bg-amber-500 text-white font-bold',
  1024: 'bg-emerald-500 text-white font-bold',
  2048: 'bg-emerald-600 text-white font-extrabold shadow-md',
  4096: 'bg-purple-600 text-white font-extrabold shadow-md',
  8192: 'bg-indigo-600 text-white font-extrabold shadow-md',
}

function getFontSize(value: number): string {
  if (value < 100) return 'text-2xl sm:text-3xl font-bold'
  if (value < 1000) return 'text-xl sm:text-2xl font-bold'
  if (value < 10000) return 'text-base sm:text-xl font-extrabold'
  return 'text-sm sm:text-base font-extrabold'
}

export const Tile2048 = memo(function Tile2048({ tile, cellSizePercent, gapPercent }: TileProps) {
  const left = tile.col * (cellSizePercent + gapPercent) + gapPercent
  const top = tile.row * (cellSizePercent + gapPercent) + gapPercent

  const colorClass = TILE_CLASSES[tile.value] || 'bg-violet-700 text-white font-extrabold'
  const fontClass = getFontSize(tile.value)

  return (
    <motion.div
      layout
      initial={tile.isNew ? { scale: 0, opacity: 0 } : false}
      animate={{
        scale: tile.isMerged ? [1, 1.18, 1] : 1,
        opacity: 1,
        left: `${left}%`,
        top: `${top}%`,
      }}
      transition={{
        layout: { duration: 0.12, ease: 'easeInOut' },
        scale: { duration: 0.15 },
        opacity: { duration: 0.1 },
      }}
      style={{
        position: 'absolute',
        width: `${cellSizePercent}%`,
        height: `${cellSizePercent}%`,
      }}
      className={cn(
        'flex items-center justify-center rounded-lg select-none transition-shadow',
        colorClass,
        fontClass
      )}
      aria-label={`Плитка ${tile.value}`}
    >
      {tile.value}
    </motion.div>
  )
})