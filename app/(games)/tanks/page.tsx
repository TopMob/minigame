'use client'

// Страница игры Танчики (2D Top-Down Tanks / Battle City)

import dynamic from 'next/dynamic'

const TanksGame = dynamic(
  () => import('@/components/games/tanks/TanksGame').then((m) => ({ default: m.TanksGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce">🪖</span>
          <span className="text-muted-foreground font-medium">Загрузка Танчиков...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function TanksPage() {
  return (
    <div className="flex flex-col items-center py-4 sm:py-6">
      <TanksGame />
    </div>
  )
}
