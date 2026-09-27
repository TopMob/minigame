// Типы для игры 4 в ряд (Connect Four)

export type Connect4Player = 'red' | 'yellow'
export type Connect4Cell = null | Connect4Player
export type Connect4Difficulty = 'easy' | 'medium' | 'hard'
export type Connect4Mode = 'vs-bot' | 'pvp-local'
export type Connect4Status = 'in_progress' | 'won' | 'draw'

export const COLS = 7
export const ROWS = 6

export type Board = Connect4Cell[][]  // [row][col], row 0 = верх

export interface Connect4State {
  board: Board
  currentPlayer: Connect4Player
  humanPlayer: Connect4Player    // в режиме vs-bot
  status: Connect4Status
  winner: Connect4Player | null
  winningCells: [number, number][] // координаты победных клеток
  difficulty: Connect4Difficulty
  mode: Connect4Mode
  scores: Record<Connect4Player, number>
  startTime: number
  isBotThinking: boolean
}
