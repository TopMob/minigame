'use client'

import dynamic from 'next/dynamic'

const MemoryGame = dynamic(
  () => import('@/components/games/memory/MemoryGame').then((m) => ({ default: m.MemoryGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🃏</span>
          <span className="text-muted-foreground">Загрузка Найди пары...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function MemoryPage() {
  return (
    <div className="flex flex-col items-center py-6">
      <MemoryGame />
    </div>
  )
}
