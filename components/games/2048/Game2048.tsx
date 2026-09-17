'use client'

// Главный компонент 2048: объединяет поле, счетчики, управление и рекорды

import { useEffect, useRef } from 'react'
import { Grid2048 } from './Grid2048'
import { use2048 } from '@/games/2048/hooks'
import { GameOverlay } from '../GameOverlay'
import { Confetti } from '../Confetti'
import { saveGameRecord } from '@/lib/storage/records'
import { formatTimeMMSS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw, Undo2, Trophy, Flame } from 'lucide-react'

export function Game2048() {
  const {
    state,
    timeElapsed,
    restart,
    undo,
    canUndo,
    keepPlaying,
    onTouchStart,
    onTouchEnd,
  } = use2048()

  const recordedRef = useRef(false)

  // Сохранение рекордов в локальное хранилище
  useEffect(() => {
    if (state.isWon && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: '2048',
        difficulty: 'classic',
        timeSeconds: timeElapsed,
        score: state.score,
        won: true,
      })
    } else if (state.isOver && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: '2048',
        difficulty: 'classic',
        timeSeconds: timeElapsed,
        score: state.score,
        won: false,
      })
    } else if (!state.isWon && !state.isOver) {
      recordedRef.current = false
    }
  }, [state.isWon, state.isOver, state.score, timeElapsed])

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-[420px] px-3">
      {/* Заголовок и карточки счета */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">2048</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Соберите плитку 2048
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[72px] border border-border">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
              Счет
            </span>
            <span className="text-base sm:text-lg font-bold font-mono">
              {state.score}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[72px] border border-border">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-0.5">
              <Trophy className="h-2.5 w-2.5 text-amber-500" /> Рекорд
            </span>
            <span className="text-base sm:text-lg font-bold font-mono">
              {state.bestScore}
            </span>
          </div>
        </div>
      </div>

      {/* Панель статуса и кнопки управления */}
      <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>Ходы: <strong className="text-foreground font-mono">{state.moves}</strong></span>
          <span>Время: <strong className="text-foreground font-mono">{formatTimeMMSS(timeElapsed)}</strong></span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            className="h-8 px-2.5 text-xs gap-1"
            title="Отменить ход"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Отмена</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={restart}
            className="h-8 px-2.5 text-xs gap-1"
            title="Начать заново"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Заново</span>
          </Button>
        </div>
      </div>

      {/* Игровое поле */}
      <div className="relative w-full flex justify-center">
        <Grid2048
          tiles={state.tiles}
          size={state.size}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />

        {/* Оверлей победы */}
        {state.isWon && (
          <>
            <Confetti />
            <GameOverlay icon="🏆" title="Победа! Вы собрали 2048!">
              <p className="text-sm text-muted-foreground">
                Счет: {state.score} | Время: {formatTimeMMSS(timeElapsed)}
              </p>
              <div className="flex gap-2 mt-2">
                <Button onClick={keepPlaying} className="gap-1.5">
                  <Flame className="h-4 w-4" /> Продолжить
                </Button>
                <Button variant="outline" onClick={restart}>
                  Заново
                </Button>
              </div>
            </GameOverlay>
          </>
        )}

        {/* Оверлей проигрыша */}
        {state.isOver && (
          <GameOverlay icon="⌛" title="Игра окончена!">
            <p className="text-sm text-muted-foreground">
              Нет доступных ходов. Финальный счет: {state.score}
            </p>
            <Button onClick={restart} className="mt-2 gap-1.5">
              <RotateCcw className="h-4 w-4" /> Играть снова
            </Button>
          </GameOverlay>
        )}
      </div>

      {/* Подсказка управления */}
      <p className="text-[11px] text-muted-foreground text-center select-none">
        Используйте стрелки клавиатуры, WASD или свайпы пальцем по полю
      </p>
    </div>
  )
}