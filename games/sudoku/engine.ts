// Движок Судоку — реализует GameEngine контракт
// Чистая логика, без React/Supabase

import type { GameEngine } from '../_lib/types'
import type { SudokuState, SudokuAction, SudokuOptions, CellState, Digit, Grid } from './types'
import { MAX_ERRORS, getPeers } from './constants'
import { generateSudoku } from './generator'
import { getHint } from './solver'

// Создание начального состояния клетки
function createCellState(value: number, isGiven: boolean): CellState {
  return {
    value: value as CellState['value'],
    notes: new Set<Digit>(),
    isGiven,
    isError: false,
  }
}

// Создание сетки CellState из Grid
function gridToCellStates(puzzle: Grid): CellState[][] {
  return puzzle.map((row) =>
    row.map((val) => createCellState(val, val !== 0))
  )
}

// Извлечение числовой сетки из CellState
function cellStatesToGrid(cells: CellState[][]): Grid {
  return cells.map((row) => row.map((cell) => cell.value))
}

// Проверка: завершена ли игра (все клетки заполнены верно)
function checkComplete(grid: CellState[][], solution: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c].value !== solution[r][c]) return false
    }
  }
  return true
}

// Проверка: есть ли конфликт при размещении цифры
export function hasConflict(grid: CellState[][], row: number, col: number, digit: Digit): boolean {
  const peers = getPeers(row, col)
  for (const peer of peers) {
    if (grid[peer.row][peer.col].value === digit) return true
  }
  return false
}

// Глубокое клонирование состояния сетки
function cloneGrid(grid: CellState[][]): CellState[][] {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      notes: new Set(cell.notes),
    }))
  )
}

export const sudokuEngine: GameEngine<SudokuState, SudokuAction, SudokuOptions> = {
  createInitialState(opts: SudokuOptions, seed?: number): SudokuState {
    const { puzzle, solution, seed: actualSeed } = generateSudoku(opts.difficulty, seed)

    return {
      grid: gridToCellStates(puzzle),
      solution,
      difficulty: opts.difficulty,
      errors: 0,
      maxErrors: MAX_ERRORS,
      isComplete: false,
      isFailed: false,
      selectedCell: null,
      isNoteMode: false,
      timeElapsed: 0,
      moves: 0,
      hintsUsed: 0,
      seed: actualSeed,
    }
  },

  applyAction(state: SudokuState, action: SudokuAction): SudokuState {
    if (state.isComplete || state.isFailed) return state

    const newGrid = cloneGrid(state.grid)
    let newErrors = state.errors
    let newMoves = state.moves
    let newHintsUsed = state.hintsUsed

    switch (action.type) {
      case 'place': {
        const { row, col, digit } = action
        const cell = newGrid[row][col]
        if (cell.isGiven) return state

        // Проверяем правильность хода по решению
        if (digit !== state.solution[row][col]) {
          newErrors++
          cell.value = digit
          cell.isError = true
        } else {
          cell.value = digit
          cell.isError = false
          cell.notes.clear()
          // Убираем эту цифру из заметок соседей
          const peers = getPeers(row, col)
          for (const peer of peers) {
            newGrid[peer.row][peer.col].notes.delete(digit)
          }
        }
        newMoves++
        break
      }

      case 'erase': {
        const { row, col } = action
        const cell = newGrid[row][col]
        if (cell.isGiven) return state
        cell.value = 0
        cell.isError = false
        newMoves++
        break
      }

      case 'toggleNote': {
        const { row, col, digit } = action
        const cell = newGrid[row][col]
        if (cell.isGiven || cell.value !== 0) return state
        if (cell.notes.has(digit)) {
          cell.notes.delete(digit)
        } else {
          cell.notes.add(digit)
        }
        break
      }

      case 'hint': {
        const { row, col, digit } = action
        const cell = newGrid[row][col]
        if (cell.isGiven) return state
        cell.value = digit
        cell.isError = false
        cell.notes.clear()
        // Убираем эту цифру из заметок соседей
        const peers = getPeers(row, col)
        for (const peer of peers) {
          newGrid[peer.row][peer.col].notes.delete(digit)
        }
        newHintsUsed++
        newMoves++
        break
      }
    }

    const isComplete = checkComplete(newGrid, state.solution)
    const isFailed = newErrors >= state.maxErrors

    return {
      ...state,
      grid: newGrid,
      errors: newErrors,
      moves: newMoves,
      hintsUsed: newHintsUsed,
      isComplete,
      isFailed,
    }
  },

  isValidAction(state: SudokuState, action: SudokuAction): boolean {
    if (state.isComplete || state.isFailed) return false

    const { row, col } = action
    if (row < 0 || row > 8 || col < 0 || col > 8) return false

    const cell = state.grid[row][col]

    switch (action.type) {
      case 'place':
        return !cell.isGiven
      case 'erase':
        return !cell.isGiven && cell.value !== 0
      case 'toggleNote':
        return !cell.isGiven && cell.value === 0
      case 'hint':
        return !cell.isGiven
    }
  },

  isGameOver(state: SudokuState): boolean {
    return state.isComplete || state.isFailed
  },

  getScore(state: SudokuState): number {
    if (!state.isComplete) return 0
    // Базовые очки за сложность + бонус за скорость - штраф за ошибки и подсказки
    const difficultyMultiplier = { easy: 1, medium: 2, hard: 3, expert: 4 }[state.difficulty]
    const baseScore = 1000 * difficultyMultiplier
    const timeBonus = Math.max(0, 600 - state.timeElapsed) * difficultyMultiplier
    const errorPenalty = state.errors * 100
    const hintPenalty = state.hintsUsed * 200
    return Math.max(0, baseScore + timeBonus - errorPenalty - hintPenalty)
  },

  hashState(state: SudokuState): string {
    const gridStr = state.grid
      .map((row) => row.map((cell) => cell.value).join(''))
      .join('')
    return `${gridStr}:${state.errors}:${state.moves}`
  },
}

// Хелпер: получить подсказку для текущего состояния
export function getSudokuHint(state: SudokuState): SudokuAction | null {
  const currentGrid = cellStatesToGrid(state.grid)
  const hint = getHint(currentGrid, state.solution)
  if (!hint) return null
  return { type: 'hint', row: hint.row, col: hint.col, digit: hint.digit }
}
