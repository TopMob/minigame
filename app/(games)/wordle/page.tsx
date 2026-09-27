'use client'

import dynamic from 'next/dynamic'

const WordleGame = dynamic(
  () => import('@/components/games/wordle/WordleGame').then((m) => ({ default: m.WordleGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🔤</span>
          <span className="text-muted-foreground">Загрузка Словоцепи...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function WordlePage() {
  return (
    <div className="flex flex-col items-center py-6">
      <WordleGame />
    </div>
  )
}
