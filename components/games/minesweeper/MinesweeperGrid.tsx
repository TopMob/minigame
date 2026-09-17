'use client'

// Сетка игрового поля Сапёра с поддержкой горизонтальной прокрутки на мобильных

import { memo } from 'react'
import { MinesweeperCell } from './MinesweeperCell'
import type { CellState } from '@/games/minesweeper/types'

interface MinesweeperGridProps {
  grid: CellState[][]
  onCellClick: (r: number, c: number) => void
  onToggleFlag: (r: number, c: number) => void
  onMouseDown: () => void
  onMouseUp: () => void
  isGameOver: boolean
}

export const MinesweeperGrid = memo(function MinesweeperGrid({
  grid,
  onCellClick,
  onToggleFlag,
  onMouseDown,
  onMouseUp,
  isGameOver,
}: MinesweeperGridProps) {
  const rows = grid.length
  const cols = grid[0]?.length || 0

  return (
    <div className="w-full overflow-x-auto p-1 scrollbar-thin">
      <div
        className="grid w-fit mx-auto border-2 border-border/80 rounded-lg p-1 bg-muted/30 shadow-inner"
        style={{
          gridTemplateColumns: `repeat(${cols}, max-content)`,
          gridTemplateRows: `repeat(${rows}, max-content)`,
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
              isGameOver={isGameOver}
            />
          ))
        )}
      </div>
    </div>
  )
})