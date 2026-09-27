'use client'

import dynamic from 'next/dynamic'

const ChessGame = dynamic(
  () => import('@/components/games/chess/ChessGame').then((m) => ({ default: m.ChessGame })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">♟️</span>
          <span className="text-muted-foreground">Загрузка Шахмат...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function ChessPage() {
  return (
    <div className="flex flex-col items-center py-4">
      <ChessGame />
    </div>
  )
}
