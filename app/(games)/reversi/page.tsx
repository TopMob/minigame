'use client'

import dynamic from 'next/dynamic'

const ReversiGame = dynamic(
  () =>
    import('@/components/games/reversi/ReversiGame').then((m) => ({
      default: m.ReversiGame,
    })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-spin">⚫</span>
          <span className="text-muted-foreground text-sm font-medium">Загрузка Реверси...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function ReversiPage() {
  return (
    <div className="flex flex-col items-center py-4 sm:py-6">
      <ReversiGame />
    </div>
  )
}
