'use client'

// Страница игры Судоку

import dynamic from 'next/dynamic'

// Динамический импорт движка — code splitting
const SudokuGame = dynamic(
  () => import('@/components/games/sudoku/SudokuGame').then((m) => ({ default: m.SudokuGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🔢</span>
          <span className="text-muted-foreground">Загрузка Судоку...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function SudokuPage() {
  return (
    <div className="flex flex-col items-center py-4">
      <SudokuGame />
    </div>
  )
}
