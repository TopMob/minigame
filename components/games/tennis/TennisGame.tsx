'use client'

// TennisGame — главный компонент игры Теннис / Пинг-понг (вид от первого лица)
// Широкоформатный корт (пол-окна / на весь экран)
// Ракетка 1:1 вместо курсора мыши (курсор скрыт, ракетка прямо под курсором)

import { useState, useCallback, useEffect } from 'react'
import { useTennisEngine } from '@/games/tennis/hooks'
import { TennisCourt } from './TennisCourt'
import { ScoreOverlay } from './ScoreOverlay'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { Button } from '@/components/ui/button'
import { RotateCcw, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react'
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wrapperEl, setWrapperEl] = useState<HTMLDivElement | null>(null)

  function toggleMute() {
    const next = soundManager.toggleMute()
    setMuted(next)
  }

  const toggleFullscreen = useCallback(() => {
    const el = wrapperEl
    if (!el) return

    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }, [wrapperEl])

  useEffect(() => {
    const onFSChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFSChange)
    return () => document.removeEventListener('fullscreenchange', onFSChange)
  }, [])

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
    <div className="flex flex-col items-center gap-3 w-full max-w-6xl px-2 sm:px-4 select-none">
      {/* ── Стили для скрытия мыши на игровом поле и подсветки кнопок ────────── */}
      <style jsx global>{`
        .tennis-court-container,
        .tennis-court-container canvas {
          cursor: none !important;
        }
        .tennis-court-container button,
        .tennis-interactive-btn {
          cursor: pointer !important;
        }
      `}</style>

      {/* ── Заголовок и контролы звука/полного экрана/перезапуска ─────────────── */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-2">
            🏓 Теннис
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Широкоформатный корт • Твоя мышь — это ракетка
          </p>
        </div>

        <div className="flex gap-1.5 items-center">
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
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Выйти из полноэкранного режима (Esc)' : 'На весь экран'}
            className="h-8 w-8 rounded-lg cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
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

      {/* ── Основная игровая область + правая панель ─────────────────────────── */}
      <div
        ref={setWrapperEl}
        className={`w-full flex flex-col lg:flex-row gap-4 items-stretch ${
          isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950 p-4 overflow-y-auto' : ''
        }`}
      >
        {/* Левая колонка: 3D корт (полностью чистый экран от первого лица) */}
        <div
          ref={containerRef}
          className={`tennis-court-container relative flex-1 overflow-hidden shadow-2xl bg-black rounded-2xl border-2 border-border/80 aspect-[16/10] sm:aspect-[16/9] min-h-[380px] max-h-[720px] ${
            isFullscreen ? 'max-h-full h-full' : ''
          }`}
          style={{
            touchAction: 'none',
            cursor: 'none',
          }}
        >
          <TennisCourt
            stateRef={stateRef}
            inputRef={inputRef}
            onStateChange={handleStateChange}
          />
        </div>

        {/* Правая колонка: Все подсказки, счёт, исход очка и управление */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col justify-start">
          <ScoreOverlay state={localUI} onServe={serve} onRestart={restart} />

          {/* Кнопка выхода из полноэкранного режима */}
          {isFullscreen && (
            <div className="mt-3">
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                className="w-full cursor-pointer flex items-center justify-center gap-1.5"
                size="sm"
              >
                <Minimize2 className="h-4 w-4" />
                <span>Выйти из полноэкранного (Esc)</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
