'use client'

// Главный компонент игры Танчики (2D Top-Down Tanks / Battle City)

import { TanksCanvas } from './TanksCanvas'
import { TanksControls } from './TanksControls'
import { useTanks } from '@/games/tanks/hooks'
import { GameOverlay } from '../GameOverlay'
import { Confetti } from '../Confetti'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { Button } from '@/components/ui/button'
import {
  Trophy,
  Target,
  Play,
  RotateCcw,
  Shield,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
} from 'lucide-react'
import type { Difficulty } from '@/games/tanks/types'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function TanksGame() {
  const {
    stateRef,
    uiState,
    restart,
    nextStage,
    togglePause,
    toggleMute,
    setDifficulty,
    setMoveDirection,
    setShootPressed,
  } = useTanks('medium')

  const totalEnemiesLeft = uiState.enemiesRemaining + uiState.enemiesOnField

  return (
    <div className="flex flex-col items-center gap-3.5 w-full max-w-[460px] px-3 select-none">
      {/* Заголовок и карточки счета */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">🪖</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Танчики
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Защищайте базу и крушите врагов
            </p>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[70px] border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-0.5">
                <Target className="h-2.5 w-2.5 text-red-500" /> Счет
              </span>
              <span className="text-base sm:text-lg font-bold font-mono">
                {uiState.score}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[70px] border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-0.5">
                <Trophy className="h-2.5 w-2.5 text-amber-500" /> Рекорд
              </span>
              <span className="text-base sm:text-lg font-bold font-mono">
                {uiState.highScore}
              </span>
            </div>
          </div>
        </div>

        {/* Выбор сложности */}
        <DifficultySelector
          difficulties={DIFFICULTIES}
          selected={uiState.difficulty}
          onChange={(d) => setDifficulty(d as Difficulty)}
        />
      </div>

      {/* Панель текущего состояния раунда */}
      <div className="flex items-center justify-between w-full bg-card/80 border border-border px-3.5 py-2 rounded-xl text-xs">
        {/* Уровень и жизни */}
        <div className="flex items-center gap-3 font-semibold">
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-bold">
            Этап {uiState.stage}
          </span>

          <div className="flex items-center gap-1 text-red-500 font-bold">
            <span className="text-sm">🛡️</span>
            <span>x {uiState.lives}</span>
          </div>

          {uiState.playerTier > 1 && (
            <span className="text-amber-500 font-bold flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" /> Т{uiState.playerTier}
            </span>
          )}
        </div>

        {/* Активные баффы и счетчик оставшихся врагов */}
        <div className="flex items-center gap-2">
          {uiState.shieldActive && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/30 animate-pulse">
              <Shield className="h-3 w-3" /> Щит
            </span>
          )}

          {uiState.freezeActive && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30 animate-pulse">
              <Clock className="h-3 w-3" /> Стоп
            </span>
          )}

          {uiState.shovelActive && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse">
              🧱 Броня
            </span>
          )}

          <div className="flex items-center gap-1 text-muted-foreground font-mono font-medium">
            <span className="text-sm">👾</span>
            <span>{totalEnemiesLeft}</span>
          </div>
        </div>
      </div>

      {/* Игровое поле с Canvas и оверлеями */}
      <div className="relative w-full flex justify-center">
        <TanksCanvas stateRef={stateRef} />

        {/* Конфетти при победе */}
        {uiState.isVictory && <Confetti />}

        {/* Оверлей паузы */}
        {uiState.isPaused && !uiState.isGameOver && !uiState.isVictory && (
          <GameOverlay icon="⏸" title="Пауза">
            <p className="text-xs text-muted-foreground mb-1">
              Игра приостановлена
            </p>
            <Button onClick={togglePause} className="gap-1.5 mt-2">
              <Play className="h-4 w-4" /> Продолжить
            </Button>
          </GameOverlay>
        )}

        {/* Оверлей поражения */}
        {uiState.isGameOver && (
          <GameOverlay
            icon={uiState.baseDestroyed ? '💥' : '☠️'}
            title={uiState.baseDestroyed ? 'Штаб уничтожен!' : 'Игра окончена!'}
          >
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mb-2">
              <p>
                {uiState.baseDestroyed
                  ? 'Враги пробили оборону и взорвали герб базы.'
                  : 'Все ваши танки были подбиты в бою.'}
              </p>
              <p className="font-semibold text-foreground text-sm pt-1">
                Финальный счет: <span className="font-mono text-primary text-base">{uiState.score}</span>
              </p>
            </div>
            <Button onClick={restart} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Играть снова
            </Button>
          </GameOverlay>
        )}

        {/* Оверлей победы на этапе */}
        {uiState.isVictory && (
          <GameOverlay icon="🏆" title={`Этап ${uiState.stage} зачищен!`}>
            <div className="text-xs sm:text-sm text-muted-foreground space-y-1 mb-2">
              <p>Отличная работа, командир! Все вражеские силы разбиты.</p>
              <p className="text-emerald-500 font-bold flex items-center justify-center gap-1">
                <Flame className="h-4 w-4" /> Бонус за зачистку: +1000 очков
              </p>
            </div>
            <Button onClick={nextStage} className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              <ArrowRight className="h-4 w-4" /> Следующий уровень
            </Button>
          </GameOverlay>
        )}
      </div>

      {/* Панель виртуального управления */}
      <TanksControls
        onDirection={setMoveDirection}
        onShoot={setShootPressed}
        onTogglePause={togglePause}
        onRestart={restart}
        onToggleMute={toggleMute}
        isPaused={uiState.isPaused}
        isMuted={uiState.isMuted}
      />

      {/* Подсказки управления на клавиатуре для ПК */}
      <div className="text-[11px] text-muted-foreground text-center select-none hidden sm:flex flex-col gap-0.5">
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">WASD</kbd> или{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Стрелки</kbd>: движение |{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Пробел</kbd> /{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">J</kbd>: стрельба
        </p>
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">P</kbd>: пауза |{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">R</kbd>: рестарт |{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">M</kbd>: звук
        </p>
      </div>
    </div>
  )
}
