// Типы для Судоку

export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type CellValue = Digit | 0 // 0 = пустая клетка

// Сетка 9x9
export type Grid = CellValue[][]

// Заметки (карандашные пометки) — множество возможных цифр
export type Notes = Set<Digit>[][]

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

// Состояние одной клетки
export interface CellState {
  value: CellValue
  notes: Set<Digit>
  isGiven: boolean // начальная подсказка — нельзя менять
  isError: boolean // подсвечивается при ошибке
}

// Действие игрока
export type SudokuAction =
  | { type: 'place'; row: number; col: number; digit: Digit }
  | { type: 'erase'; row: number; col: number }
  | { type: 'toggleNote'; row: number; col: number; digit: Digit }
  | { type: 'hint'; row: number; col: number; digit: Digit }

// Полное состояние игры
export interface SudokuState {
  grid: CellState[][] // текущее состояние сетки
  solution: Grid // правильное решение
  difficulty: Difficulty
  errors: number // количество ошибок
  maxErrors: number // максимум ошибок (3)
  isComplete: boolean
  isFailed: boolean
  selectedCell: { row: number; col: number } | null
  isNoteMode: boolean
  timeElapsed: number // секунды
  moves: number
  hintsUsed: number
  seed: number
}

// Опции для создания новой игры
export interface SudokuOptions {
  difficulty: Difficulty
}

// Конфигурация сложности: сколько клеток оставить заполненными
export const DIFFICULTY_CONFIG: Record<Difficulty, { givens: number; label: string }> = {
  easy: { givens: 38, label: 'Лёгкий' },
  medium: { givens: 30, label: 'Средний' },
  hard: { givens: 25, label: 'Сложный' },
  expert: { givens: 22, label: 'Эксперт' },
}
