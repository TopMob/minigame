'use client'

import type { ReversiBoard as BoardType, ReversiMove } from '@/games/reversi/types'
import { ReversiCell } from './ReversiCell'

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const ROWS = ['1', '2', '3', '4', '5', '6', '7', '8']

interface ReversiBoardProps {
  board: BoardType
  validMoves: ReversiMove[]
  lastMove: { row: number; col: number } | null
  recentFlips: [number, number][]
  isThinking: boolean
  onMove: (r: number, c: number) => void
}

export function ReversiBoard({
  board,
  validMoves,
  lastMove,
  recentFlips,
  isThinking,
  onMove,
}: ReversiBoardProps) {
  // Проверка перевернута ли фишка на этом ходу
  const isCellFlipped = (r: number, c: number) =>
    recentFlips.some(([fr, fc]) => fr === r && fc === c)

  const isMoveValid = (r: number, c: number) =>
    validMoves.find((m) => m.row === r && m.col === c)

  return (
    <div className="relative mx-auto w-full max-w-[460px] p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-amber-950/80 to-amber-900/90 shadow-2xl border-4 border-amber-900/60">
      {/* Верхняя строка координат */}
      <div className="grid grid-cols-8 px-5 pb-1 text-center text-[10px] sm:text-xs font-bold text-amber-200/70 select-none">
        {COLS.map((col) => (
          <span key={`top-${col}`}>{col}</span>
        ))}
      </div>

      <div className="flex items-center">
        {/* Левая колонка цифр */}
        <div className="flex flex-col justify-around py-1 pr-1.5 h-full text-[10px] sm:text-xs font-bold text-amber-200/70 select-none">
          {ROWS.map((row) => (
            <span key={`left-${row}`} className="h-full flex items-center">{row}</span>
          ))}
        </div>

        {/* Игровое поле (зеленое сукно) */}
        <div className="relative flex-1 aspect-square rounded-xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-1 shadow-inner border border-emerald-950/50 overflow-hidden">
          {/* 4 классические ориентирные точки (звёзды) */}
          <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-950/60 pointer-events-none z-10" />
          <div className="absolute top-[25%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-950/60 pointer-events-none z-10" />
          <div className="absolute top-[75%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-950/60 pointer-events-none z-10" />
          <div className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-950/60 pointer-events-none z-10" />

          {/* Сетка 8x8 */}
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full border border-emerald-950/40 rounded-lg overflow-hidden bg-emerald-700/80">
            {board.map((row, r) =>
              row.map((cell, c) => (
                <ReversiCell
                  key={`${r}-${c}`}
                  row={r}
                  col={c}
                  value={cell}
                  validMove={isMoveValid(r, c)}
                  isLastMove={lastMove?.row === r && lastMove?.col === c}
                  isFlipped={isCellFlipped(r, c)}
                  isThinking={isThinking}
                  onMove={onMove}
                />
              ))
            )}
          </div>
        </div>

        {/* Правая колонка цифр */}
        <div className="flex flex-col justify-around py-1 pl-1.5 h-full text-[10px] sm:text-xs font-bold text-amber-200/70 select-none">
          {ROWS.map((row) => (
            <span key={`right-${row}`} className="h-full flex items-center">{row}</span>
          ))}
        </div>
      </div>

      {/* Нижняя строка координат */}
      <div className="grid grid-cols-8 px-5 pt-1 text-center text-[10px] sm:text-xs font-bold text-amber-200/70 select-none">
        {COLS.map((col) => (
          <span key={`bot-${col}`}>{col}</span>
        ))}
      </div>
    </div>
  )
}
