'use client'

// Главный компонент игры Судоку — собирает все части вместе

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SudokuGrid } from './SudokuGrid'
import { SudokuNumpad } from './SudokuNumpad'
import { SudokuControls } from './SudokuControls'
import { DifficultySelector } from '@/components/shared/DifficultySelector'
import { useSudoku } from '@/games/sudoku/hooks'
import type { Difficulty, Digit } from '@/games/sudoku/types'
import { DIFFICULTY_CONFIG } from '@/games/sudoku/types'
import { cn, formatTimeMMSS } from '@/lib/utils'
import { GameOverlay } from '../GameOverlay'
import { Confetti } from '../Confetti'
import { sudokuEngine } from '@/games/sudoku/engine'
import { saveGameRecord } from '@/lib/storage/records'

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
  const recordedRef = useRef(false)

  // Сохранение рекорда в локальное хранилище при завершении игры
  useEffect(() => {
    if (state.isComplete && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'sudoku',
        difficulty: state.difficulty,
        timeSeconds: state.timeElapsed,
        score: sudokuEngine.getScore(state),
        won: true,
      })
    } else if (state.isFailed && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'sudoku',
        difficulty: state.difficulty,
        timeSeconds: state.timeElapsed,
        score: 0,
        won: false,
      })
    } else if (!state.isComplete && !state.isFailed) {
      recordedRef.current = false
    }
  }, [state])

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
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) {
        toggleNoteMode()
        return
      }

      // Z — отмена, Y — повтор
      if (e.ctrlKey && e.key === 'z') { undo(); return }
      if (e.ctrlKey && e.key === 'y') { redo(); return }

      // H — подсказка
      if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey) {
        applyHint()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, isGameOver, state.selectedCell, handleDigit, handleErase, selectCell, toggleNoteMode, undo, redo, applyHint])


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
          <span className="font-mono text-lg tabular-nums">{formatTimeMMSS(state.timeElapsed)}</span>
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
          <GameOverlay icon="⏸" title="Пауза">
              <button
                type="button"
                onClick={resume}
                className="rounded-lg bg-accent px-6 py-2 text-white font-medium hover:bg-accent/80 transition-colors"
              >
                Продолжить
              </button>
            </GameOverlay>
        )}

        {/* Оверлей завершения */}
        {state.isComplete && (
          <>
            <Confetti />
            <GameOverlay icon="🎉" title="Поздравляем!">
              <span className="text-muted-foreground">
                Время: {formatTimeMMSS(state.timeElapsed)} | Ошибки: {state.errors} | Ходы: {state.moves}
              </span>
              <span className="text-lg font-bold text-accent">
                Очки: {sudokuEngine.getScore(state)}
              </span>
              <button
                type="button"
                onClick={() => newGame(state.difficulty)}
                className="rounded-lg bg-accent px-6 py-2 text-white font-medium hover:bg-accent/80 transition-colors"
              >
                Новая игра
              </button>
            </GameOverlay>
          </>
        )}

        {/* Оверлей проигрыша */}
        {state.isFailed && (
          <GameOverlay icon="😔" title="Слишком много ошибок">
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
            </GameOverlay>
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
        Стрелки: навигация | 1-9: цифра | Backspace: стереть | N: заметки | H: подсказка | Ctrl+Z/Y: отмена/повтор
      </div>
    </div>
  )
}
