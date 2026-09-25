'use client'

// Страница игры Теннис (Пинг-понг)

import dynamic from 'next/dynamic'

const TennisGame = dynamic(
  () => import('@/components/games/Tennis/TennisGame').then((m) => ({ default: m.TennisGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🎾</span>
          <span className="text-muted-foreground">Загрузка Тенниса...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function TennisPage() {
  return (
    <div className="flex flex-col items-center py-6">
      <TennisGame />
    </div>
  )
}
