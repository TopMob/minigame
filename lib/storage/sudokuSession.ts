// Хранилище для автосохранения активной сессии Судоку в localStorage

import type { SudokuState, Digit } from '@/games/sudoku/types'

const SUDOKU_SESSION_KEY = 'minigame:sudoku_session'

interface SerializedCellState {
  value: number
  notes: Digit[]
  isGiven: boolean
  isError: boolean
}

interface SerializedSudokuState extends Omit<SudokuState, 'grid'> {
  grid: SerializedCellState[][]
}

/**
 * Сохраняет текущее состояние партии в localStorage.
 * Преобразует Set заметок в массивы для корректной JSON-сериализации.
 */
export function saveSudokuSession(state: SudokuState): void {
  if (typeof window === 'undefined') return
  if (state.isComplete || state.isFailed) {
    clearSudokuSession()
    return
  }

  try {
    const serialized: SerializedSudokuState = {
      ...state,
      grid: state.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          notes: Array.from(cell.notes),
        }))
      ),
    }
    localStorage.setItem(SUDOKU_SESSION_KEY, JSON.stringify(serialized))
  } catch {
    // Безопасно игнорируем ошибки доступа к localStorage
  }
}

/**
 * Загружает сохраненную сессию Судоку.
 * Восстанавливает Set заметок из массива.
 */
export function loadSudokuSession(): SudokuState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(SUDOKU_SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as SerializedSudokuState
    if (!parsed || !Array.isArray(parsed.grid) || parsed.grid.length !== 9) {
      return null
    }

    const state: SudokuState = {
      ...parsed,
      grid: parsed.grid.map((row) =>
        row.map((cell) => ({
          ...cell,
          value: cell.value as SudokuState['grid'][0][0]['value'],
          notes: new Set<Digit>(cell.notes || []),
        }))
      ),
    }

    if (state.isComplete || state.isFailed) {
      clearSudokuSession()
      return null
    }

    return state
  } catch {
    return null
  }
}

/**
 * Удаляет сохраненную сессию Судоку
 */
export function clearSudokuSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(SUDOKU_SESSION_KEY)
  } catch {}
}
