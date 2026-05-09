'use client'

// Клетка Судоку — отображение значения, заметок, подсветка

import { cn } from '@/lib/utils'
import type { CellState, Digit } from '@/games/sudoku/types'

interface SudokuCellProps {
  cell: CellState
  row: number
  col: number
  isSelected: boolean
  isHighlighted: boolean // та же строка/столбец/блок
  isSameValue: boolean // та же цифра
  onClick: () => void
}

export function SudokuCell({
  cell,
  row,
  col,
  isSelected,
  isHighlighted,
  isSameValue,
  onClick,
}: SudokuCellProps) {
  // Границы блоков 3x3
  const borderRight = col === 2 || col === 5
  const borderBottom = row === 2 || row === 5
  const borderLeft = col === 0
  const borderTop = row === 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center aspect-square w-full',
        'text-lg sm:text-xl md:text-2xl font-medium transition-colors',
        'border-r border-b border-border/50',
        'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:z-10',
        // Толстые границы блоков
        borderRight && 'border-r-2 border-r-foreground/30',
        borderBottom && 'border-b-2 border-b-foreground/30',
        borderLeft && 'border-l-2 border-l-foreground/30',
        borderTop && 'border-t-2 border-t-foreground/30',
        col === 8 && 'border-r-2 border-r-foreground/30',
        row === 8 && 'border-b-2 border-b-foreground/30',
        // Подсветка
        isSelected && 'bg-accent/30',
        !isSelected && isHighlighted && 'bg-accent/10',
        !isSelected && !isHighlighted && isSameValue && 'bg-accent/15',
        !isSelected && !isHighlighted && !isSameValue && 'bg-card',
        // Стили значений
        cell.isGiven && 'font-bold text-foreground',
        !cell.isGiven && !cell.isError && cell.value !== 0 && 'text-accent',
        cell.isError && 'text-red-500 bg-red-500/10',
      )}
      aria-label={`Строка ${row + 1}, столбец ${col + 1}${cell.value ? `, значение ${cell.value}` : ', пусто'}`}
    >
      {cell.value !== 0 ? (
        cell.value
      ) : cell.notes.size > 0 ? (
        <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
          {([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).map((d) => (
            <span
              key={d}
              className={cn(
                'flex items-center justify-center text-[8px] sm:text-[9px] md:text-[10px] leading-none',
                cell.notes.has(d) ? 'text-muted-foreground' : 'text-transparent'
              )}
            >
              {d}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  )
}
