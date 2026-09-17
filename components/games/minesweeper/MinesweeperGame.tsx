'use client'

// Главный компонент игры Сапёр

import { useEffect, useRef } from 'react'
import { MinesweeperGrid } from './MinesweeperGrid'
import { useMinesweeper } from '@/games/minesweeper/hooks'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { GameOverlay } from '../GameOverlay'
import { Confetti } from '../Confetti'
import { saveGameRecord } from '@/lib/storage/records'
import { minesweeperEngine } from '@/games/minesweeper/engine'
import { Button } from '@/components/ui/button'
import { RotateCcw, Flag, Pickaxe } from 'lucide-react'
import type { Difficulty } from '@/games/minesweeper/types'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

function padDigits(num: number, digits = 3): string {
  if (num < 0) {
    return '-' + Math.abs(num).toString().padStart(digits - 1, '0')
  }
  return num.toString().padStart(digits, '0')
}

export function MinesweeperGame() {
  const {
    state,
    mode,
    isPressing,
    toggleMode,
    handleClick,
    toggleFlag,
    restart,
    setDifficulty,
    setIsPressing,
  } = useMinesweeper('easy')

  const recordedRef = useRef(false)
  const isGameOver = state.status === 'won' || state.status === 'lost'

  // Сохранение рекорда при завершении игры
  useEffect(() => {
    if (state.status === 'won' && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'minesweeper',
        difficulty: state.difficulty,
        timeSeconds: state.timeElapsed,
        score: minesweeperEngine.getScore(state),
        won: true,
      })
    } else if (state.status === 'lost' && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'minesweeper',
        difficulty: state.difficulty,
        timeSeconds: state.timeElapsed,
        score: 0,
        won: false,
      })
    } else if (state.status === 'playing' || state.status === 'idle') {
      recordedRef.current = false
    }
  }, [state])

  // Выбор смайлика
  const getSmiley = () => {
    if (state.status === 'won') return '😎'
    if (state.status === 'lost') return '😵'
    if (isPressing) return '😮'
    return '🙂'
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-[650px] px-3">
      {/* Заголовок и селектор сложности */}
      <div className="flex flex-col items-center gap-3 w-full">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Сапёр</h1>
        <DifficultySelector
          difficulties={DIFFICULTIES}
          selected={state.difficulty}
          onChange={(d) => setDifficulty(d as Difficulty)}
        />
      </div>

      {/* Верхняя ретро-панель со счетчиками и смайликом */}
      <div className="flex items-center justify-between w-full max-w-[420px] bg-muted/60 border border-border rounded-xl px-4 py-2.5 shadow-xs">
        {/* Счетчик оставшихся мин */}
        <div className="bg-zinc-950 text-red-500 font-mono font-bold text-xl sm:text-2xl px-2.5 py-1 rounded-md border border-zinc-800 tracking-widest select-none">
          {padDigits(state.minesRemaining)}
        </div>

        {/* Смайлик: кнопка перезапуска */}
        <button
          type="button"
          onClick={restart}
          className="text-2xl sm:text-3xl w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-muted active:scale-95 transition-transform shadow-2xs"
          title="Перезапустить партию"
          aria-label="Перезапустить"
        >
          {getSmiley()}
        </button>

        {/* Счетчик времени */}
        <div className="bg-zinc-950 text-red-500 font-mono font-bold text-xl sm:text-2xl px-2.5 py-1 rounded-md border border-zinc-800 tracking-widest select-none">
          {padDigits(state.timeElapsed)}
        </div>
      </div>

      {/* Кнопка переключения режима для тач-экранов */}
      <div className="flex sm:hidden w-full max-w-[420px] justify-center">
        <Button
          variant={mode === 'flag' ? 'default' : 'outline'}
          size="sm"
          onClick={toggleMode}
          className="gap-2 w-full h-10 font-semibold"
        >
          {mode === 'flag' ? (
            <>
              <Flag className="h-4 w-4 text-red-500" />
              <span>Режим: Флаг (нажмите для копания)</span>
            </>
          ) : (
            <>
              <Pickaxe className="h-4 w-4 text-amber-500" />
              <span>Режим: Открыть (нажмите для флага)</span>
            </>
          )}
        </Button>
      </div>

      {/* Игровое поле с оверлеями */}
      <div className="relative w-full flex justify-center">
        <MinesweeperGrid
          grid={state.grid}
          onCellClick={handleClick}
          onToggleFlag={toggleFlag}
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          isGameOver={isGameOver}
        />

        {/* Оверлей победы */}
        {state.status === 'won' && (
          <>
            <Confetti />
            <GameOverlay icon="🎉" title="Поздравляем с победой!">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Время разминирования: <strong className="text-foreground">{state.timeElapsed} сек.</strong></p>
                <p>Набрано очков: <strong className="text-foreground">{minesweeperEngine.getScore(state)}</strong></p>
              </div>
              <Button onClick={restart} className="mt-2 gap-1.5">
                <RotateCcw className="h-4 w-4" /> Новая игра
              </Button>
            </GameOverlay>
          </>
        )}

        {/* Оверлей поражения */}
        {state.status === 'lost' && (
          <GameOverlay icon="💥" title="Вы наступили на мину!">
            <p className="text-sm text-muted-foreground">
              Не повезло, попробуйте еще раз!
            </p>
            <Button onClick={restart} className="mt-2 gap-1.5">
              <RotateCcw className="h-4 w-4" /> Попробовать снова
            </Button>
          </GameOverlay>
        )}
      </div>

      {/* Подсказки управления */}
      <p className="text-[11px] text-muted-foreground text-center select-none">
        Левый клик: открыть ячейку | Правый клик: флаг | Клик по числу: открыть окружение (хординг)
      </p>
    </div>
  )
}