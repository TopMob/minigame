'use client'

// TennisGame — главный компонент игры Теннис / Пинг-понг (вид от первого лица)

import { useState, useCallback } from 'react'
import { useTennisEngine } from '@/games/tennis/hooks'
import { TennisCourt } from './TennisCourt'
import { ScoreOverlay } from './ScoreOverlay'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { Button } from '@/components/ui/button'
import { RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { soundManager } from '@/lib/audio/sounds'
import type { TennisDifficulty, TennisState } from '@/games/tennis/types'

const DIFFICULTIES: TennisDifficulty[] = ['easy', 'medium', 'hard']

export function TennisGame() {
  const {
    uiState,
    stateRef,
    inputRef,
    containerRef,
    serve,
    restart,
    setDifficulty,
  } = useTennisEngine('medium')

  const [muted, setMuted] = useState(soundManager.isMuted)
  const [localUI, setLocalUI] = useState(uiState)

  function toggleMute() {
    const next = soundManager.toggleMute()
    setMuted(next)
  }

  // Обновление UI от canvas-цикла без лишних ре-рендеров
  const handleStateChange = useCallback((nextState: TennisState, isSmash = false) => {
    setLocalUI({
      score: { ...nextState.score },
      phase: nextState.phase,
      serveBy: nextState.serveBy,
      pointWinner: nextState.pointWinner,
      faultReason: nextState.faultReason,
      matchOver: nextState.matchOver,
      matchWinner: nextState.matchWinner,
      difficulty: nextState.difficulty,
      rallyCount: nextState.rallyCount,
      isSmash,
    })
  }, [])

  return (
    <div className="flex flex-col items-center gap-3.5 w-full max-w-[460px] px-3 select-none">
      {/* ── Заголовок и контролы звука/перезапуска ────────────────────────────── */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2">
            🏓 Теннис
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Вид от первого лица • Управление ракеткой мышью
          </p>
        </div>

        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            title={muted ? 'Включить звук' : 'Выключить звук'}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            title="Новая игра"
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Выбор уровня сложности ────────────────────────────────────────────── */}
      <div className="w-full flex justify-center">
        <DifficultySelector
          difficulties={DIFFICULTIES}
          selected={localUI.difficulty}
          onChange={(d) => setDifficulty(d as TennisDifficulty)}
        />
      </div>

      {/* ── Игровое 3D поле (стол от первого лица) ────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden border-2 border-border/80 shadow-2xl bg-black"
        style={{
          aspectRatio: '3/4',
          touchAction: 'none',
          cursor: 'none',
        }}
      >
        <TennisCourt
          stateRef={stateRef}
          inputRef={inputRef}
          onStateChange={handleStateChange}
        />
        <ScoreOverlay state={localUI} onServe={serve} />
      </div>

      {/* ── Подсказки управления ──────────────────────────────────────────────── */}
      <div className="text-[11px] text-muted-foreground text-center space-y-0.5 hidden sm:block">
        <p>🏓 <strong>Двигай мышь</strong> — ракетка в руке следует за курсором</p>
        <p>⚡ <strong>Резкий взмах вперед</strong> — мощный смэш с подкруткой | Клик — подача</p>
      </div>

      <p className="text-[11px] text-muted-foreground text-center sm:hidden">
        Веди пальцем — ракетка | Резкий свайп — смэш | Тап — подача
      </p>
    </div>
  )
}
