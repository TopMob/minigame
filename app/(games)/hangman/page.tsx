'use client'

import dynamic from 'next/dynamic'

const HangmanGame = dynamic(
  () => import('@/components/games/hangman/HangmanGame').then((m) => ({ default: m.HangmanGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">📝</span>
          <span className="text-muted-foreground">Загрузка Виселицы...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function HangmanPage() {
  return (
    <div className="flex flex-col items-center py-6">
      <HangmanGame />
    </div>
  )
}
