'use client'

import { Dices, RefreshCw, RotateCw, ShieldCheck } from 'lucide-react'
import { FLEET_CONFIG, TOTAL_SHIPS, type PlacedShip, type ShipOrientation, type ShipType } from '@/games/battleship/types'
import { Button } from '@/components/ui/button'

interface ShipDockProps {
  playerFleet: PlacedShip[]
  selectedSize: ShipType | null
  orientation: ShipOrientation
  remainingCounts: Record<ShipType, number>
  onSelectSize: (size: ShipType) => void
  onToggleOrientation: () => void
  onRandomize: () => void
  onClear: () => void
  onStartBattle: () => void
}

export function ShipDock({
  playerFleet,
  selectedSize,
  orientation,
  remainingCounts,
  onSelectSize,
  onToggleOrientation,
  onRandomize,
  onClear,
  onStartBattle,
}: ShipDockProps) {
  const isAllPlaced = playerFleet.length === TOTAL_SHIPS

  return (
    <div className="flex flex-col gap-3 w-full bg-card/80 border border-border p-3 sm:p-4 rounded-xl shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold">⚓ Док кораблей</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {playerFleet.length} / {TOTAL_SHIPS}
          </span>
        </div>

        {/* Переключатель ориентации */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleOrientation}
          className="gap-1.5 h-8 text-xs cursor-pointer border-primary/40 hover:bg-primary/10"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>{orientation === 'horizontal' ? '↔ Горизонтально' : '↕ Вертикально'}</span>
        </Button>
      </div>

      {/* Список кораблей для расстановки */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {FLEET_CONFIG.map(({ size, name }) => {
          const count = remainingCounts[size]
          const isSelected = selectedSize === size && count > 0
          const isDone = count === 0

          return (
            <button
              key={size}
              type="button"
              onClick={() => count > 0 && onSelectSize(size)}
              disabled={isDone}
              className={`
                flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all
                ${
                  isDone
                    ? 'opacity-40 border-border/40 bg-muted/20 cursor-default'
                    : isSelected
                    ? 'border-primary bg-primary/15 shadow-xs ring-1 ring-primary cursor-pointer'
                    : 'border-border/70 hover:border-primary/50 hover:bg-muted/40 cursor-pointer'
                }
              `}
            >
              <div className="flex items-center justify-between w-full text-[11px] font-semibold">
                <span>{name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isDone ? 'bg-muted text-muted-foreground' : 'bg-primary/20 text-primary'
                }`}>
                  ×{count}
                </span>
              </div>

              {/* Визуальные сегменты палуб */}
              <div className="flex items-center gap-1 py-1">
                {Array.from({ length: size }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-xs border ${
                      isDone
                        ? 'bg-muted border-border'
                        : isSelected
                        ? 'bg-primary border-primary-foreground shadow-xs'
                        : 'bg-muted-foreground/30 border-muted-foreground/60'
                    }`}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Кнопки управления расстановкой */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onRandomize}
            className="gap-1.5 text-xs h-8 cursor-pointer"
          >
            <Dices className="h-3.5 w-3.5" />
            Случайно
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={playerFleet.length === 0}
            className="gap-1.5 text-xs h-8 cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Очистить
          </Button>
        </div>

        <Button
          onClick={onStartBattle}
          disabled={!isAllPlaced}
          className={`gap-1.5 h-9 text-xs sm:text-sm font-bold transition-all ${
            isAllPlaced
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse cursor-pointer'
              : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          В бой! {isAllPlaced ? '🚀' : `(${playerFleet.length}/10)`}
        </Button>
      </div>
    </div>
  )
}
