'use client'

import dynamic from 'next/dynamic'

const BattleshipGame = dynamic(
  () =>
    import('@/components/games/battleship/BattleshipGame').then((m) => ({
      default: m.BattleshipGame,
    })),
  {
    loading: () => (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl animate-bounce">🚢</span>
          <span className="text-muted-foreground text-sm font-medium">Загрузка Морского боя...</span>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function BattleshipPage() {
  return (
    <div className="flex flex-col items-center py-4 sm:py-6">
      <BattleshipGame />
    </div>
  )
}
