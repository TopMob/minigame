'use client'

// Главный компонент игры Змейка

import { useEffect, useRef } from 'react'
import { SnakeCanvas } from './SnakeCanvas'
import { SnakeControls } from './SnakeControls'
import { useSnake } from '@/games/snake/hooks'
import { GameOverlay } from '../GameOverlay'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { saveGameRecord } from '@/lib/storage/records'
import { Button } from '@/components/ui/button'
import { Trophy, Apple, RotateCcw, Play } from 'lucide-react'
import type { Difficulty } from '@/games/snake/types'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function SnakeGame() {
  const {
    state,
    changeDirection,
    restart,
    togglePause,
    setDifficulty,
    onTouchStart,
    onTouchEnd,
  } = useSnake('medium')

  const recordedRef = useRef(false)

  // Сохранение рекорда при завершении игры
  useEffect(() => {
    if (state.isOver && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'snake',
        difficulty: state.difficulty,
        timeSeconds: state.moves,
        score: state.score,
        won: false,
      })
    } else if (!state.isOver) {
      recordedRef.current = false
    }
  }, [state.isOver, state.score, state.difficulty, state.moves])

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[420px] px-3">
      {/* Заголовок и селектор сложности */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Змейка</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Собирайте яблоки и растите
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[70px] border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-0.5">
                <Apple className="h-2.5 w-2.5 text-red-500" /> Счет
              </span>
              <span className="text-base sm:text-lg font-bold font-mono">
                {state.score}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[70px] border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-0.5">
                <Trophy className="h-2.5 w-2.5 text-amber-500" /> Рекорд
              </span>
              <span className="text-base sm:text-lg font-bold font-mono">
                {state.bestScore}
              </span>
            </div>
          </div>
        </div>

        <DifficultySelector
          difficulties={DIFFICULTIES}
          selected={state.difficulty}
          onChange={(d) => setDifficulty(d as Difficulty)}
        />
      </div>

      {/* Игровое поле с оверлеями */}
      <div className="relative w-full flex justify-center">
        <SnakeCanvas
          state={state}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />

        {/* Оверлей паузы */}
        {state.isPaused && !state.isOver && (
          <GameOverlay icon="⏸" title="Пауза">
            <Button onClick={togglePause} className="gap-1.5 mt-2">
              <Play className="h-4 w-4" /> Продолжить
            </Button>
          </GameOverlay>
        )}

        {/* Оверлей проигрыша */}
        {state.isOver && (
          <GameOverlay icon="💥" title="Игра окончена!">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Финальный счет: <strong className="text-foreground">{state.score}</strong></p>
              <p>Съедено яблок: <strong className="text-foreground">{state.applesEaten}</strong></p>
            </div>
            <Button onClick={restart} className="gap-1.5 mt-2">
              <RotateCcw className="h-4 w-4" /> Играть снова
            </Button>
          </GameOverlay>
        )}
      </div>

      {/* Панель управления и D-Pad */}
      <SnakeControls
        onDirection={changeDirection}
        onTogglePause={togglePause}
        onRestart={restart}
        isPaused={state.isPaused}
        isOver={state.isOver}
      />

      {/* Подсказка для десктопа */}
      <p className="text-[11px] text-muted-foreground text-center select-none hidden sm:block">
        Стрелки или WASD: движение | Пробел: пауза
      </p>
    </div>
  )
}