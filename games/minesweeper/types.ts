// Типы для игры Сапёр

export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface CellState {
  row: number
  col: number
  isMine: boolean
  adjacentMines: number
  isRevealed: boolean
  isFlagged: boolean
  isExploded?: boolean
  isWrongFlag?: boolean
}

export interface MinesweeperState {
  grid: CellState[][]
  rows: number
  cols: number
  totalMines: number
  minesRemaining: number
  status: GameStatus
  timeElapsed: number
  firstClickDone: boolean
  difficulty: Difficulty
  cellsRevealed: number
  totalSafeCells: number
}

export type MinesweeperAction =
  | { type: 'reveal'; row: number; col: number }
  | { type: 'toggleFlag'; row: number; col: number }
  | { type: 'chord'; row: number; col: number }
  | { type: 'restart' }
  | { type: 'setDifficulty'; difficulty: Difficulty }

export interface MinesweeperOptions {
  difficulty?: Difficulty
  rows?: number
  cols?: number
  mines?: number
}

export const MINESWEEPER_CONFIG: Record<
  Difficulty,
  { label: string; rows: number; cols: number; mines: number }
> = {
  easy: { label: 'Лёгкий', rows: 9, cols: 9, mines: 10 },
  medium: { label: 'Средний', rows: 16, cols: 16, mines: 40 },
  hard: { label: 'Сложный', rows: 16, cols: 30, mines: 99 },
}