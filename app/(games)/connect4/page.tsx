'use client'

import dynamic from 'next/dynamic'

const Connect4Game = dynamic(
  () => import('@/components/games/connect4/Connect4Game').then((m) => ({ default: m.Connect4Game })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🔴</span>
          <span className="text-muted-foreground">Загрузка Четыре в ряд...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function Connect4Page() {
  return (
    <div className="flex flex-col items-center py-6">
      <Connect4Game />
    </div>
  )
}
