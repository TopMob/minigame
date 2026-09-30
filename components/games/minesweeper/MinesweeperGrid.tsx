'use client'

// Сетка игрового поля Сапёра с поддержкой масштабирования,
// горизонтальной прокрутки и подсветки соседей

import { memo } from 'react'
import { MinesweeperCell } from './MinesweeperCell'
import type { CellState } from '@/games/minesweeper/types'

interface MinesweeperGridProps {
  grid: CellState[][]
  onCellClick: (r: number, c: number) => void
  onToggleFlag: (r: number, c: number) => void
  onMouseDown: () => void
  onMouseUp: () => void
  onHoverNeighbors?: (r: number, c: number, enabled: boolean) => void
  isGameOver: boolean
  zoom?: number
}

export const MinesweeperGrid = memo(function MinesweeperGrid({
  grid,
  onCellClick,
  onToggleFlag,
  onMouseDown,
  onMouseUp,
  onHoverNeighbors,
  isGameOver,
  zoom = 1,
}: MinesweeperGridProps) {
  const rows = grid.length
  const cols = grid[0]?.length || 0

  return (
    <div className="w-full overflow-x-auto p-1 scrollbar-thin flex justify-center">
      <div
        className="grid w-fit mx-auto border-2 border-border/80 rounded-xl p-1.5 bg-muted/40 shadow-inner transition-transform origin-top"
        style={{
          gridTemplateColumns: `repeat(${cols}, max-content)`,
          gridTemplateRows: `repeat(${rows}, max-content)`,
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        }}
        role="grid"
        aria-label="Поле Сапёра"
      >
        {grid.map((row) =>
          row.map((cell) => (
            <MinesweeperCell
              key={`${cell.row}-${cell.col}`}
              cell={cell}
              onClick={onCellClick}
              onContextMenu={onToggleFlag}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onHoverNeighbors={onHoverNeighbors}
              isGameOver={isGameOver}
            />
          ))
        )}
      </div>
    </div>
  )
})