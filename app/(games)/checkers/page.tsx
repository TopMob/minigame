'use client'

import dynamic from 'next/dynamic'

const CheckersGame = dynamic(
  () => import('@/components/games/checkers/CheckersGame').then((m) => ({ default: m.CheckersGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🏁</span>
          <span className="text-muted-foreground">Загрузка Шашек...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function CheckersPage() {
  return (
    <div className="flex flex-col items-center py-6">
      <CheckersGame />
    </div>
  )
}
