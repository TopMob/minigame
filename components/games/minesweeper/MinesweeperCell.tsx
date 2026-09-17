'use client'

// Компонент ячейки Сапёра с поддержкой правого клика, долгого нажатия и хординга

import { memo, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { CellState } from '@/games/minesweeper/types'

interface MinesweeperCellProps {
  cell: CellState
  onClick: (r: number, c: number) => void
  onContextMenu: (r: number, c: number) => void
  onMouseDown: () => void
  onMouseUp: () => void
  isGameOver: boolean
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600 dark:text-blue-400 font-bold',
  2: 'text-emerald-600 dark:text-emerald-400 font-bold',
  3: 'text-rose-600 dark:text-rose-400 font-bold',
  4: 'text-indigo-600 dark:text-indigo-400 font-extrabold',
  5: 'text-amber-700 dark:text-amber-500 font-extrabold',
  6: 'text-teal-600 dark:text-teal-400 font-extrabold',
  7: 'text-zinc-800 dark:text-zinc-200 font-extrabold',
  8: 'text-zinc-500 dark:text-zinc-400 font-extrabold',
}

export const MinesweeperCell = memo(function MinesweeperCell({
  cell,
  onClick,
  onContextMenu,
  onMouseDown,
  onMouseUp,
  isGameOver,
}: MinesweeperCellProps) {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    isLongPressRef.current = false
    if (e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      if (!cell.isRevealed) {
        onContextMenu(cell.row, cell.col)
      }
    }, 380)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || e.touches.length === 0) return
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x)
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y)
    if (dx > 8 || dy > 8) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleClick = () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }
    onClick(cell.row, cell.col)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(cell.row, cell.col)
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      disabled={isGameOver && !cell.isRevealed}
      aria-label={`Клетка ${cell.row + 1}, ${cell.col + 1}`}
      className={cn(
        'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base select-none transition-colors border',
        cell.isRevealed
          ? cell.isExploded
            ? 'bg-rose-500/30 border-rose-500 text-rose-500 font-bold'
            : 'bg-muted/40 border-border/50'
          : 'bg-card hover:bg-muted/70 active:bg-muted border-border font-medium shadow-2xs cursor-pointer',
        cell.isWrongFlag && 'bg-rose-500/20 border-rose-500 text-rose-500'
      )}
    >
      {cell.isRevealed ? (
        cell.isMine ? (
          cell.isExploded ? '💥' : '💣'
        ) : cell.adjacentMines > 0 ? (
          <span className={NUMBER_COLORS[cell.adjacentMines] || ''}>
            {cell.adjacentMines}
          </span>
        ) : null
      ) : cell.isFlagged ? (
        cell.isWrongFlag ? (
          <span title="Неверный флаг" className="text-rose-500 font-bold">❌</span>
        ) : (
          '🚩'
        )
      ) : null}
    </button>
  )
})