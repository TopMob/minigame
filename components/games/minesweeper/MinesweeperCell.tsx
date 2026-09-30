'use client'

// Компонент ячейки Сапёра: тактильный 3D дизайн, подсветка соседей при хординге,
// поддержка вопросительных знаков (?), подсказок и мобильного долгого нажатия

import { memo, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { CellState } from '@/games/minesweeper/types'

interface MinesweeperCellProps {
  cell: CellState
  onClick: (r: number, c: number) => void
  onContextMenu: (r: number, c: number) => void
  onMouseDown: () => void
  onMouseUp: () => void
  onHoverNeighbors?: (r: number, c: number, enabled: boolean) => void
  isGameOver: boolean
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600 dark:text-blue-400 font-extrabold',
  2: 'text-emerald-600 dark:text-emerald-400 font-extrabold',
  3: 'text-rose-600 dark:text-rose-400 font-extrabold',
  4: 'text-indigo-600 dark:text-indigo-400 font-black',
  5: 'text-amber-700 dark:text-amber-400 font-black',
  6: 'text-cyan-600 dark:text-cyan-400 font-black',
  7: 'text-purple-600 dark:text-purple-400 font-black',
  8: 'text-zinc-600 dark:text-zinc-400 font-black',
}

export const MinesweeperCell = memo(function MinesweeperCell({
  cell,
  onClick,
  onContextMenu,
  onMouseDown,
  onMouseUp,
  onHoverNeighbors,
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
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(35)
        }
        onContextMenu(cell.row, cell.col)
      }
    }, 360)
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

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }

    // Средняя кнопка мыши -> мгновенный хординг
    if (e.button === 1) {
      e.preventDefault()
      onClick(cell.row, cell.col)
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
      onMouseDown={(e) => {
        if (e.button === 0 || e.button === 1) {
          onMouseDown()
          if (cell.isRevealed && cell.adjacentMines > 0) {
            onHoverNeighbors?.(cell.row, cell.col, true)
          }
        }
      }}
      onMouseUp={() => {
        onMouseUp()
        if (cell.isRevealed) {
          onHoverNeighbors?.(cell.row, cell.col, false)
        }
      }}
      onMouseEnter={() => {
        if (cell.isRevealed && cell.adjacentMines > 0) {
          onHoverNeighbors?.(cell.row, cell.col, true)
        }
      }}
      onMouseLeave={() => {
        if (cell.isRevealed) {
          onHoverNeighbors?.(cell.row, cell.col, false)
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      disabled={isGameOver && !cell.isRevealed}
      aria-label={`Клетка ${cell.row + 1}, ${cell.col + 1}`}
      className={cn(
        'w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base select-none transition-all rounded-xs',
        // Открытая ячейка
        cell.isRevealed
          ? cell.isExploded
            ? 'bg-rose-500/30 border border-rose-500 text-rose-500 font-black shadow-inner animate-pulse'
            : 'bg-muted/30 border border-border/40 font-mono text-center shadow-xs'
          : cell.isHighlighted
            ? 'bg-muted/90 border border-primary/50 scale-[0.96] shadow-inner'
            : 'bg-gradient-to-b from-card to-muted/80 hover:from-muted/70 hover:to-muted border-t-white/30 dark:border-t-white/10 border-l-white/30 dark:border-l-white/10 border-b-black/25 dark:border-b-black/50 border-r-black/25 dark:border-r-black/50 border-2 active:border-inset active:scale-[0.97] shadow-xs cursor-pointer',
        // Неверный флаг при поражении
        cell.isWrongFlag && 'bg-rose-500/20 border-rose-500 text-rose-500',
        // Подсветка подсказки
        cell.isHinted &&
          'ring-2 ring-amber-400 bg-amber-500/20 dark:bg-amber-400/25 animate-pulse z-10'
      )}
    >
      {cell.isRevealed ? (
        cell.isMine ? (
          cell.isExploded ? (
            <span className="scale-110 drop-shadow-sm">💥</span>
          ) : (
            <span className="drop-shadow-xs">💣</span>
          )
        ) : cell.adjacentMines > 0 ? (
          <span className={cn('drop-shadow-2xs', NUMBER_COLORS[cell.adjacentMines] || '')}>
            {cell.adjacentMines}
          </span>
        ) : null
      ) : cell.isFlagged ? (
        cell.isWrongFlag ? (
          <span title="Неверный флаг" className="text-rose-500 font-bold">
            ❌
          </span>
        ) : (
          <span className="drop-shadow-sm scale-105">🚩</span>
        )
      ) : cell.isQuestion ? (
        <span className="text-sky-500 dark:text-sky-400 font-bold text-xs">❓</span>
      ) : null}
    </button>
  )
})