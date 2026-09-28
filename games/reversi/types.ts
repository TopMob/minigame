// Типы для игры Реверси (Отелло)

export type ReversiPlayer = 'black' | 'white'
export type ReversiCell = null | ReversiPlayer
export type ReversiDifficulty = 'easy' | 'medium' | 'hard'
export type ReversiMode = 'vs-bot' | 'pvp-local'
export type ReversiStatus = 'in_progress' | 'won' | 'draw'

export const BOARD_SIZE = 8

export type ReversiBoard = ReversiCell[][]

export interface ReversiMove {
  row: number
  col: number
  flips: [number, number][]
}

export interface ReversiHistoryEntry {
  board: ReversiBoard
  currentPlayer: ReversiPlayer
  pieces: Record<ReversiPlayer, number>
  lastMove: { row: number; col: number } | null
  scores: Record<ReversiPlayer, number>
}

export interface ReversiState {
  board: ReversiBoard
  currentPlayer: ReversiPlayer
  humanPlayer: ReversiPlayer
  status: ReversiStatus
  winner: ReversiPlayer | null
  pieces: Record<ReversiPlayer, number>
  validMoves: ReversiMove[] // доступные ходы для текущего игрока
  lastMove: { row: number; col: number } | null
  recentFlips: [number, number][] // клетки, перевернутые на последнем ходу
  difficulty: ReversiDifficulty
  mode: ReversiMode
  scores: Record<ReversiPlayer, number> // счет побед в серии
  startTime: number
  isBotThinking: boolean
  passMessage: string | null
  history: ReversiHistoryEntry[]
}
