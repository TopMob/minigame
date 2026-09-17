'use client'

// Экранные кнопки управления для мобильных устройств (D-Pad)

import { useState } from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Volume2, VolumeX, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { soundManager } from '@/lib/audio/sounds'
import type { Direction } from '@/games/snake/types'

interface SnakeControlsProps {
  onDirection: (dir: Direction) => void
  onTogglePause: () => void
  onRestart: () => void
  isPaused: boolean
  isOver: boolean
}

export function SnakeControls({
  onDirection,
  onTogglePause,
  onRestart,
  isPaused,
  isOver,
}: SnakeControlsProps) {
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted)

  const toggleSound = () => {
    const next = soundManager.toggleMute()
    setIsMuted(next)
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[420px]">
      {/* Кнопки паузы, звука и перезапуска */}
      <div className="flex items-center justify-between w-full px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSound}
          className="h-9 px-3 gap-1.5"
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-primary" />}
          <span className="text-xs">{isMuted ? 'Без звука' : 'Звук'}</span>
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePause}
            disabled={isOver}
            className="h-9 px-3 gap-1.5"
          >
            {isPaused ? <Play className="h-4 w-4 text-emerald-500" /> : <Pause className="h-4 w-4" />}
            <span className="text-xs">{isPaused ? 'Продолжить' : 'Пауза'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRestart}
            className="h-9 px-3 gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs">Заново</span>
          </Button>
        </div>
      </div>

      {/* Экранный D-Pad для сенсорных экранов (виден всегда на мобильных) */}
      <div className="grid grid-cols-3 gap-2 w-48 sm:hidden mt-2 select-none">
        <div />
        <Button
          variant="secondary"
          className="h-12 w-12 rounded-xl flex items-center justify-center p-0"
          onClick={() => onDirection('UP')}
          aria-label="Вверх"
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
        <div />

        <Button
          variant="secondary"
          className="h-12 w-12 rounded-xl flex items-center justify-center p-0"
          onClick={() => onDirection('LEFT')}
          aria-label="Влево"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="secondary"
          className="h-12 w-12 rounded-xl flex items-center justify-center p-0"
          onClick={() => onDirection('DOWN')}
          aria-label="Вниз"
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
        <Button
          variant="secondary"
          className="h-12 w-12 rounded-xl flex items-center justify-center p-0"
          onClick={() => onDirection('RIGHT')}
          aria-label="Вправо"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}