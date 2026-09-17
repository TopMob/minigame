'use client'

// Страница игры Змейка

import dynamic from 'next/dynamic'

const SnakeGame = dynamic(
  () => import('@/components/games/snake/SnakeGame').then((m) => ({ default: m.SnakeGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🐍</span>
          <span className="text-muted-foreground">Загрузка Змейки...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function SnakePage() {
  return (
    <div className="flex flex-col items-center py-6">
      <SnakeGame />
    </div>
  )
}