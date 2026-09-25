'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { TicTacToeCell } from './TicTacToeCell'
import type { Board, WinningLine } from '@/games/tictactoe/types'

interface TicTacToeBoardProps {
  board: Board
  winningLine: WinningLine | null
  disabled: boolean
  onCellClick: (index: number) => void
}

export function TicTacToeBoard({
  board,
  winningLine,
  disabled,
  onCellClick,
}: TicTacToeBoardProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(4) // Центр по умолчанию
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 1-9 цифры для прямого выбора клетки
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key, 10) - 1
        setFocusedIndex(index)
        onCellClick(index)
        return
      }

      let nextIndex = focusedIndex

      switch (e.key) {
        case 'ArrowUp':
          nextIndex = focusedIndex >= 3 ? focusedIndex - 3 : focusedIndex
          e.preventDefault()
          break
        case 'ArrowDown':
          nextIndex = focusedIndex <= 5 ? focusedIndex + 3 : focusedIndex
          e.preventDefault()
          break
        case 'ArrowLeft':
          nextIndex = focusedIndex % 3 !== 0 ? focusedIndex - 1 : focusedIndex
          e.preventDefault()
          break
        case 'ArrowRight':
          nextIndex = focusedIndex % 3 !== 2 ? focusedIndex + 1 : focusedIndex
          e.preventDefault()
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onCellClick(focusedIndex)
          return
        default:
          return
      }

      if (nextIndex !== focusedIndex) {
        setFocusedIndex(nextIndex)
      }
    },
    [focusedIndex, onCellClick]
  )

  // Переносим DOM-фокус на активную кнопку внутри сетки при навигации
  useEffect(() => {
    if (!containerRef.current) return
    const buttons = containerRef.current.querySelectorAll('button')
    if (buttons[focusedIndex]) {
      buttons[focusedIndex].focus()
    }
  }, [focusedIndex])

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-label="Игровое поле 3 на 3"
      onKeyDown={handleKeyDown}
      className="grid grid-cols-3 gap-3 p-4 bg-muted/30 border border-border rounded-3xl w-full max-w-[340px] sm:max-w-[380px] shadow-xs"
    >
      {board.map((val, idx) => {
        const isWinning = winningLine !== null && winningLine.includes(idx)
        return (
          <TicTacToeCell
            key={idx}
            index={idx}
            value={val}
            isWinning={isWinning}
            disabled={disabled}
            isFocused={focusedIndex === idx}
            onClick={() => {
              setFocusedIndex(idx)
              onCellClick(idx)
            }}
            onFocus={() => setFocusedIndex(idx)}
          />
        )
      })}
    </div>
  )
}
