// Типы для игры Сапёр

export type Difficulty = 'easy' | 'medium' | 'hard' | 'custom'
export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface CellState {
  row: number
  col: number
  isMine: boolean
  adjacentMines: number
  isRevealed: boolean
  isFlagged: boolean
  isQuestion?: boolean
  isExploded?: boolean
  isWrongFlag?: boolean
  isHighlighted?: boolean // подсветка при хординге / наведении
  isHinted?: boolean // подсветка подсказки
}

export interface HintInfo {
  row: number
  col: number
  action: 'reveal' | 'flag'
  reason: string
}

export interface CustomBoardConfig {
  rows: number
  cols: number
  mines: number
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
  customConfig?: CustomBoardConfig
  hint?: HintInfo | null
}

export type MinesweeperAction =
  | { type: 'reveal'; row: number; col: number }
  | { type: 'toggleFlag'; row: number; col: number; useQuestionMarks?: boolean }
  | { type: 'chord'; row: number; col: number }
  | { type: 'restart' }
  | { type: 'setDifficulty'; difficulty: Difficulty; customConfig?: CustomBoardConfig }
  | { type: 'highlightNeighbors'; row: number; col: number; enabled: boolean }
  | { type: 'getHint' }
  | { type: 'clearHint' }

export interface MinesweeperOptions {
  difficulty?: Difficulty
  rows?: number
  cols?: number
  mines?: number
  customConfig?: CustomBoardConfig
}

export const MINESWEEPER_CONFIG: Record<
  Exclude<Difficulty, 'custom'>,
  { label: string; rows: number; cols: number; mines: number }
> = {
  easy: { label: 'Лёгкий', rows: 9, cols: 9, mines: 10 },
  medium: { label: 'Средний', rows: 16, cols: 16, mines: 40 },
  hard: { label: 'Сложный', rows: 16, cols: 30, mines: 99 },
}