'use client'

// Страница игры 2048

import dynamic from 'next/dynamic'

const Game2048 = dynamic(
  () => import('@/components/games/2048/Game2048').then((m) => ({ default: m.Game2048 })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🧮</span>
          <span className="text-muted-foreground">Загрузка 2048...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function Game2048Page() {
  return (
    <div className="flex flex-col items-center py-6">
      <Game2048 />
    </div>
  )
}