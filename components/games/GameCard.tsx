'use client'

import Link from 'next/link'
import type { GameMeta } from '@/types/game'

interface GameCardProps {
  game: GameMeta
}

export function GameCard({ game }: GameCardProps) {
  const isDisabled = !game.isActive

  return (
    <Link
      href={isDisabled ? '#' : game.path}
      className={`
        group relative flex flex-col items-center justify-center gap-3 rounded-xl border border-border
        bg-card p-6 text-card-foreground shadow-sm transition-all duration-200
        ${isDisabled
          ? 'cursor-not-allowed opacity-50'
          : 'hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5'
        }
      `}
      onClick={(e) => {
        if (isDisabled) e.preventDefault()
      }}
      aria-disabled={isDisabled}
    >
      <span className="text-4xl" role="img" aria-label={game.name}>
        {game.icon}
      </span>
      <h3 className="text-sm font-semibold">{game.name}</h3>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {game.isMultiplayer && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
            Мультиплеер
          </span>
        )}
        {!game.isActive && (
          <span className="rounded-full bg-muted px-2 py-0.5">
            Скоро
          </span>
        )}
      </div>
    </Link>
  )
}
