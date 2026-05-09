'use client'

// Главный компонент игры Судоку — собирает все части вместе

import { useCallback, useEffect, useMemo } from 'react'
import { SudokuGrid } from './SudokuGrid'
import { SudokuNumpad } from './SudokuNumpad'
import { SudokuControls } from './SudokuControls'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { useSudoku } from '@/games/sudoku/hooks'
import type { Difficulty, Digit } from '@/games/sudoku/types'
import { DIFFICULTY_CONFIG } from '@/games/sudoku/types'
import { cn } from '@/lib/utils'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

export function SudokuGame() {
  const {
    state,
    placeDigit,
    eraseCell,
    toggleNote,
    applyHint,
    selectCell,
    toggleNoteMode,
    undo,
    redo,
    pause,
    resume,
    newGame,
    restart,
    canUndo,
    canRedo,
    isPaused,
  } = useSudoku('easy')

  const isGameOver = state.isComplete || state.isFailed

  // Подсчёт цифр на поле
  const digitCounts = useMemo(() => {
    const counts: Record<number, number> = {}
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = state.grid[r][c].value
        if (v !== 0) {
          counts[v] = (counts[v] ?? 0) + 1
        }
      }
    }
    return counts
  }, [state.grid])

  // Обработка клика по клетке
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      selectCell(row, col)
    },
    [selectCell]
  )

  // Обработка нажатия цифры
  const handleDigit = useCallback(
    (digit: Digit) => {
      if (!state.selectedCell) return
      const { row, col } = state.selectedCell
      if (state.isNoteMode) {
        toggleNote(row, col, digit)
      } else {
        placeDigit(row, col, digit)
      }
    },
    [state.selectedCell, state.isNoteMode, placeDigit, toggleNote]
  )

  // Обработка стирания
  const handleErase = useCallback(() => {
    if (!state.selectedCell) return
    eraseCell(state.selectedCell.row, state.selectedCell.col)
  }, [state.selectedCell, eraseCell])

  // Клавиатурное управление
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isPaused || isGameOver) return

      // Цифры 1-9
      const digit = parseInt(e.key)
      if (digit >= 1 && digit <= 9) {
        handleDigit(digit as Digit)
        return
      }

      // Backspace / Delete — стереть
      if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase()
        return
      }

      // Стрелки — навигация
      if (e.key.startsWith('Arrow') && state.selectedCell) {
        e.preventDefault()
        const { row, col } = state.selectedCell
        switch (e.key) {
          case 'ArrowUp': selectCell(Math.max(0, row - 1), col); break
          case 'ArrowDown': selectCell(Math.min(8, row + 1), col); break
          case 'ArrowLeft': selectCell(row, Math.max(0, col - 1)); break
          case 'ArrowRight': selectCell(row, Math.min(8, col + 1)); break
        }
        return
      }

      // N — переключение режима заметок
      if (e.key === 'n' || e.key === 'N') {
        toggleNoteMode()
        return
      }

      // Z — отмена, Y — повтор
      if (e.ctrlKey && e.key === 'z') { undo(); return }
      if (e.ctrlKey && e.key === 'y') { redo(); return }

      // H — подсказка
      if (e.key === 'h' || e.key === 'H') {
        applyHint()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, isGameOver, state.selectedCell, handleDigit, handleErase, selectCell, toggleNoteMode, undo, redo, applyHint])

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Заголовок и выбор сложности */}
      <div className="flex flex-col items-center gap-3 w-full">
        <h1 className="text-2xl sm:text-3xl font-bold">Судоку</h1>
        <DifficultySelector
          difficulties={DIFFICULTIES}
          selected={state.difficulty}
          onChange={(d) => newGame(d as Difficulty)}
        />
      </div>

      {/* Информационная панель */}
      <div className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base">
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Время</span>
          <span className="font-mono text-lg tabular-nums">{formatTime(state.timeElapsed)}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Ошибки</span>
          <span className={cn(
            'font-mono text-lg tabular-nums',
            state.errors > 0 && 'text-red-500'
          )}>
            {state.errors}/{state.maxErrors}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Ходы</span>
          <span className="font-mono text-lg tabular-nums">{state.moves}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">Сложность</span>
          <span className="text-sm font-medium">{DIFFICULTY_CONFIG[state.difficulty].label}</span>
        </div>
      </div>

      {/* Игровое поле с оверлеем паузы/конца */}
      <div className="relative w-full flex justify-center">
        <SudokuGrid state={state} onCellClick={handleCellClick} />

        {/* Оверлей паузы */}
        {isPaused && !isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">⏸</span>
              <span className="text-xl font-semibold">Пауза</span>
              <button
                type="button"
                onClick={resume}
                className="rounded-lg bg-accent px-6 py-2 text-white font-medium hover:bg-accent/80 transition-colors"
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {/* Оверлей завершения */}
        {state.isComplete && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">🎉</span>
              <span className="text-xl font-semibold">Поздравляем!</span>
              <span className="text-muted-foreground">
                Время: {formatTime(state.timeElapsed)} | Ошибки: {state.errors} | Ходы: {state.moves}
              </span>
              <span className="text-lg font-bold text-accent">
                Очки: {getScore(state)}
              </span>
              <button
                type="button"
                onClick={() => newGame(state.difficulty)}
                className="rounded-lg bg-accent px-6 py-2 text-white font-medium hover:bg-accent/80 transition-colors"
              >
                Новая игра
              </button>
            </div>
          </div>
        )}

        {/* Оверлей проигрыша */}
        {state.isFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-md">
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">😔</span>
              <span className="text-xl font-semibold">Слишком много ошибок</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={restart}
                  className="rounded-lg border border-border px-4 py-2 font-medium hover:bg-accent/10 transition-colors"
                >
                  Заново
                </button>
                <button
                  type="button"
                  onClick={() => newGame(state.difficulty)}
                  className="rounded-lg bg-accent px-4 py-2 text-white font-medium hover:bg-accent/80 transition-colors"
                >
                  Новая игра
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Управление */}
      <SudokuControls
        onUndo={undo}
        onRedo={redo}
        onHint={applyHint}
        onToggleNotes={toggleNoteMode}
        onPause={pause}
        canUndo={canUndo}
        canRedo={canRedo}
        isNoteMode={state.isNoteMode}
        hintsUsed={state.hintsUsed}
        disabled={isPaused || isGameOver}
      />

      {/* Цифровая клавиатура */}
      <SudokuNumpad
        onDigit={handleDigit}
        onErase={handleErase}
        digitCounts={digitCounts}
        disabled={isPaused || isGameOver || !state.selectedCell}
      />

      {/* Подсказки по клавиатуре */}
      <div className="text-xs text-muted-foreground text-center mt-2 hidden sm:block">
        Стрелки — навигация | 1-9 — цифра | Backspace — стереть | N — заметки | H — подсказка | Ctrl+Z/Y — отмена/повтор
      </div>
    </div>
  )
}

// Подсчёт очков (дублирует engine.getScore для отображения)
function getScore(state: { isComplete: boolean; difficulty: Difficulty; timeElapsed: number; errors: number; hintsUsed: number }): number {
  if (!state.isComplete) return 0
  const difficultyMultiplier = { easy: 1, medium: 2, hard: 3, expert: 4 }[state.difficulty]
  const baseScore = 1000 * difficultyMultiplier
  const timeBonus = Math.max(0, 600 - state.timeElapsed) * difficultyMultiplier
  const errorPenalty = state.errors * 100
  const hintPenalty = state.hintsUsed * 200
  return Math.max(0, baseScore + timeBonus - errorPenalty - hintPenalty)
}
