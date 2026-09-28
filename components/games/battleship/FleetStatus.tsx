'use client'

import { TOTAL_DECKS, TOTAL_SHIPS, type PlacedShip } from '@/games/battleship/types'

interface FleetStatusProps {
  title: string
  subtitle?: string
  fleet: PlacedShip[]
  isEnemy?: boolean
}

export function FleetStatus({ title, subtitle, fleet, isEnemy = false }: FleetStatusProps) {
  const sunkShipsCount = fleet.filter((s) => s.isSunk).length
  const aliveShipsCount = fleet.length - sunkShipsCount

  let totalHits = 0
  for (const ship of fleet) {
    totalHits += ship.hits
  }
  const remainingDecks = TOTAL_DECKS - totalHits

  // Сортируем корабли по размеру для аккуратного отображения
  const sortedFleet = [...fleet].sort((a, b) => b.size - a.size)

  return (
    <div className={`p-3 rounded-xl border flex flex-col gap-2 w-full transition-all ${
      isEnemy
        ? 'bg-rose-950/20 border-rose-900/40 text-foreground'
        : 'bg-cyan-950/20 border-cyan-900/40 text-foreground'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <span>{isEnemy ? '🎯' : '🛡️'}</span>
            <span>{title}</span>
          </div>
          {subtitle && (
            <div className="text-[10px] text-muted-foreground">{subtitle}</div>
          )}
        </div>

        <div className="text-right">
          <div className="text-xs font-black">
            {remainingDecks} / {TOTAL_DECKS} <span className="text-[10px] font-normal text-muted-foreground">палуб</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Кораблей: {aliveShipsCount} / {TOTAL_SHIPS}
          </div>
        </div>
      </div>

      {/* Линейка мини-силуэтов кораблей */}
      <div className="grid grid-cols-5 gap-1.5 pt-1">
        {sortedFleet.map((ship, idx) => (
          <div
            key={ship.id || idx}
            className={`
              flex items-center justify-center p-1 rounded-sm border transition-all
              ${
                ship.isSunk
                  ? 'border-rose-900/60 bg-rose-950/40 opacity-50 grayscale'
                  : ship.hits > 0
                  ? 'border-amber-500/60 bg-amber-500/10'
                  : 'border-border/60 bg-card/60'
              }
            `}
            title={`${ship.name}: ${ship.hits}/${ship.size} попаданий`}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: ship.size }).map((_, deckIdx) => {
                const isDeckHit = deckIdx < ship.hits
                return (
                  <div
                    key={deckIdx}
                    className={`w-1.5 h-3 rounded-2xs ${
                      ship.isSunk
                        ? 'bg-rose-500 line-through'
                        : isDeckHit
                        ? 'bg-amber-500 animate-pulse'
                        : isEnemy
                        ? 'bg-rose-400/80'
                        : 'bg-cyan-400/80'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
