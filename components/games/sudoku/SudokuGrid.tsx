'use client'

// Сетка Судоку 9x9 — основной компонент поля

import { SudokuCell } from './SudokuCell'
import type { SudokuState, Digit } from '@/games/sudoku/types'
import { getBoxIndex } from '@/games/sudoku/constants'

interface SudokuGridProps {
  state: SudokuState
  onCellClick: (row: number, col: number) => void
}

import { memo } from 'react'

export const SudokuGrid = memo(function SudokuGrid({ state, onCellClick }: SudokuGridProps) {
  const { grid, selectedCell } = state

  // Определяем подсветку
  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : 0

  const selectedBox = selectedCell
    ? getBoxIndex(selectedCell.row, selectedCell.col)
    : -1

  return (
    <div
      className="grid grid-cols-9 border-2 border-foreground/30 rounded-md overflow-hidden w-full max-w-[450px] aspect-square"
      role="grid"
      aria-label="Поле Судоку"
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const isSelected = selectedCell?.row === r && selectedCell?.col === c
          const isHighlighted = selectedCell
            ? r === selectedCell.row ||
              c === selectedCell.col ||
              getBoxIndex(r, c) === selectedBox
            : false
          const isSameValue =
            !isSelected && selectedValue !== 0 && cell.value === selectedValue

          return (
            <SudokuCell
              key={`${r}-${c}`}
              cell={cell}
              row={r}
              col={c}
              isSelected={isSelected}
              isHighlighted={isHighlighted && !isSelected}
              isSameValue={isSameValue}
              onClick={onCellClick}
            />
          )
        })
      )}
    </div>
  )
})
