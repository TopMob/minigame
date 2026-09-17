'use client'

// Игровое поле 2048 со слоем пустых ячеек и анимированными плитками

import { memo } from 'react'
import { Tile2048 } from './Tile2048'
import type { Tile } from '@/games/2048/types'

interface Grid2048Props {
  tiles: Tile[]
  size: number
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export const Grid2048 = memo(function Grid2048({
  tiles,
  size,
  onTouchStart,
  onTouchEnd,
}: Grid2048Props) {
  const gapPercent = 2.5
  const totalGaps = size + 1
  const totalGapPercent = totalGaps * gapPercent
  const cellSizePercent = (100 - totalGapPercent) / size

  const backgroundCells = Array.from({ length: size * size }, (_, i) => i)

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'none' }}
      className="relative w-full max-w-[420px] aspect-square rounded-2xl bg-muted/80 p-3 select-none border border-border shadow-xs"
      role="grid"
      aria-label="Игровое поле 2048"
    >
      {/* Сетка фоновых пустых ячеек */}
      <div
        className="grid w-full h-full gap-2.5"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {backgroundCells.map((idx) => (
          <div
            key={idx}
            className="w-full h-full rounded-lg bg-card/60 border border-border/40"
          />
        ))}
      </div>

      {/* Слой активных плиток */}
      <div className="absolute inset-0 pointer-events-none">
        {tiles.map((tile) => (
          <Tile2048
            key={tile.id}
            tile={tile}
            cellSizePercent={cellSizePercent}
            gapPercent={gapPercent}
          />
        ))}
      </div>
    </div>
  )
})