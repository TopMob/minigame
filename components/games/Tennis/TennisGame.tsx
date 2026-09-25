'use client'

// TennisGame — главный компонент игры Теннис
// Собирает: корт (canvas), оверлей счёта, панель управления сложностью

import { useTennisEngine } from '@/games/tennis/hooks'
import { TennisCourt } from './TennisCourt'
import { ScoreOverlay } from './ScoreOverlay'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { Button } from '@/components/ui/button'
import { RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import type { TennisDifficulty } from '@/games/tennis/types'

const DIFFICULTIES: TennisDifficulty[] = ['easy', 'medium', 'hard']

export function TennisGame() {
  const { state, containerRef, serve, restart, setDifficulty } = useTennisEngine('medium')
  const [muted, setMuted] = useState(soundManager.isMuted)

  function toggleMute() {
    const next = soundManager.toggleMute()
    setMuted(next)
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[420px] px-3">
      {/* ── Заголовок ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Теннис</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Управляй ракеткой мышью / пальцем
          </p>
        </div>

        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            title={muted ? 'Включить звук' : 'Выключить звук'}
            className="h-8 w-8 rounded-lg"
          >
            {muted
              ? <VolumeX className="h-4 w-4 text-muted-foreground" />
              : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            title="Новая игра"
            className="h-8 w-8 rounded-lg"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Сложность ─────────────────────────────────────────────────────────── */}
      <DifficultySelector
        difficulties={DIFFICULTIES}
        selected={state.difficulty}
        onChange={(d) => setDifficulty(d as TennisDifficulty)}
      />

      {/* ── Игровое поле ──────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden border-2 border-border shadow-lg select-none"
        style={{ aspectRatio: '7/10', touchAction: 'none', cursor: 'none' }}
      >
        <TennisCourt state={state} />
        <ScoreOverlay state={state} onServe={serve} />
      </div>

      {/* ── Подсказки ─────────────────────────────────────────────────────────── */}
      <div className="text-[11px] text-muted-foreground text-center space-y-0.5 hidden sm:block">
        <p>Двигай мышь — ракетка следует с инерцией</p>
        <p>Скорость движения → сила удара | Клик / тап — подача</p>
      </div>

      {/* Мобильная подсказка */}
      <p className="text-[11px] text-muted-foreground text-center sm:hidden">
        Тяни пальцем — ракетка | Тап — подача
      </p>
    </div>
  )
}
