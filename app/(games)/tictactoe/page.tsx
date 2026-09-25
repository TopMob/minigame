'use client'

import dynamic from 'next/dynamic'

const TicTacToeGame = dynamic(
  () => import('@/components/games/tictactoe/TicTacToeGame').then((m) => ({ default: m.TicTacToeGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">❌</span>
          <span className="text-muted-foreground">Загрузка Крестиков-ноликов...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function TicTacToePage() {
  return (
    <div className="flex flex-col items-center py-6">
      <TicTacToeGame />
    </div>
  )
}
