'use client'

import { getAllGames } from '@/games/registry'
import { GameCard } from './GameCard'

export function GameGrid() {
  const games = getAllGames()

  return (
    <section className="py-8">
      <h2 className="mb-6 text-2xl font-bold">Все игры</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
