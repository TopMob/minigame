'use client'

// Страница игры Сапёр

import dynamic from 'next/dynamic'

const MinesweeperGame = dynamic(
  () => import('@/components/games/minesweeper/MinesweeperGame').then((m) => ({ default: m.MinesweeperGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">💣</span>
          <span className="text-muted-foreground">Загрузка Сапёра...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function MinesweeperPage() {
  return (
    <div className="flex flex-col items-center py-6">
      <MinesweeperGame />
    </div>
  )
}