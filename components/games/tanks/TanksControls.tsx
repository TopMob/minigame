'use client'

// Виртуальный геймпад для игры Танчики:
// - Сенсорный 4-позиционный D-Pad для направления движения
// - Кнопка стрельбы с тактильным откликом
// - Кнопки паузы, звука и рестарта

import { memo } from 'react'
import { Direction } from '@/games/tanks/types'
import { Button } from '@/components/ui/button'
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Crosshair,
} from 'lucide-react'

interface TanksControlsProps {
  onDirection: (dir: Direction | null) => void
  onShoot: (pressed: boolean) => void
  onTogglePause: () => void
  onRestart: () => void
  onToggleMute: () => void
  isPaused: boolean
  isMuted: boolean
}

export const TanksControls = memo(function TanksControls({
  onDirection,
  onShoot,
  onTogglePause,
  onRestart,
  onToggleMute,
  isPaused,
  isMuted,
}: TanksControlsProps) {
  const handleDirStart = (dir: Direction, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    onDirection(dir)
  }

  const handleDirEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    onDirection(null)
  }

  const handleShootStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    onShoot(true)
  }

  const handleShootEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    onShoot(false)
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[440px] px-2 select-none">
      {/* Верхний бар быстрых действий */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePause}
            className="h-9 px-3 gap-1.5 text-xs font-medium rounded-lg"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? 'Продолжить' : 'Пауза'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleMute}
            className="h-9 w-9 p-0 rounded-lg"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          className="h-9 px-3 gap-1.5 text-xs font-medium rounded-lg hover:text-red-500 hover:border-red-500/50"
        >
          <RotateCcw className="h-4 w-4" />
          Сброс
        </Button>
      </div>

      {/* Мобильный блок управления: D-Pad слева, Кнопка Огонь справа */}
      <div className="flex items-center justify-between w-full pt-1 pb-2">
        {/* Сенсорный D-Pad */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Центр */}
          <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border flex items-center justify-center" />

          {/* Вверх */}
          <button
            type="button"
            className="absolute top-0 w-11 h-12 rounded-t-xl bg-card border-2 border-border active:bg-primary active:text-primary-foreground shadow-md flex items-center justify-center transition-transform active:scale-95 touch-none"
            onTouchStart={(e) => handleDirStart('up', e)}
            onTouchEnd={handleDirEnd}
            onMouseDown={(e) => handleDirStart('up', e)}
            onMouseUp={handleDirEnd}
            aria-label="Вверх"
          >
            <ArrowUp className="h-5 w-5" />
          </button>

          {/* Вниз */}
          <button
            type="button"
            className="absolute bottom-0 w-11 h-12 rounded-b-xl bg-card border-2 border-border active:bg-primary active:text-primary-foreground shadow-md flex items-center justify-center transition-transform active:scale-95 touch-none"
            onTouchStart={(e) => handleDirStart('down', e)}
            onTouchEnd={handleDirEnd}
            onMouseDown={(e) => handleDirStart('down', e)}
            onMouseUp={handleDirEnd}
            aria-label="Вниз"
          >
            <ArrowDown className="h-5 w-5" />
          </button>

          {/* Влево */}
          <button
            type="button"
            className="absolute left-0 h-11 w-12 rounded-l-xl bg-card border-2 border-border active:bg-primary active:text-primary-foreground shadow-md flex items-center justify-center transition-transform active:scale-95 touch-none"
            onTouchStart={(e) => handleDirStart('left', e)}
            onTouchEnd={handleDirEnd}
            onMouseDown={(e) => handleDirStart('left', e)}
            onMouseUp={handleDirEnd}
            aria-label="Влево"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Вправо */}
          <button
            type="button"
            className="absolute right-0 h-11 w-12 rounded-r-xl bg-card border-2 border-border active:bg-primary active:text-primary-foreground shadow-md flex items-center justify-center transition-transform active:scale-95 touch-none"
            onTouchStart={(e) => handleDirStart('right', e)}
            onTouchEnd={handleDirEnd}
            onMouseDown={(e) => handleDirStart('right', e)}
            onMouseUp={handleDirEnd}
            aria-label="Вправо"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Кнопка Стрельбы */}
        <div className="flex flex-col items-center gap-1.5 pr-2">
          <button
            type="button"
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-amber-600 text-white font-black text-sm shadow-xl border-4 border-amber-400/40 active:scale-95 active:shadow-inner flex flex-col items-center justify-center gap-0.5 transition-all touch-none"
            onTouchStart={handleShootStart}
            onTouchEnd={handleShootEnd}
            onMouseDown={handleShootStart}
            onMouseUp={handleShootEnd}
            aria-label="Выстрел"
          >
            <Crosshair className="h-7 w-7 animate-pulse" />
            <span className="text-[11px] tracking-wider uppercase font-bold">Огонь</span>
          </button>
        </div>
      </div>
    </div>
  )
})
