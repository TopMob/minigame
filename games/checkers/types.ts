// Типы для игры Шашки (Russian Checkers)

export type CheckersDifficulty = 'easy' | 'medium' | 'hard'
export type CheckersPlayer = 'black' | 'white'  // black ходит первым
export type CheckersStatus = 'in_progress' | 'won' | 'draw'

export type PieceType = 'man' | 'king'  // man = обычная шашка, king = дамка

export interface CheckersPiece {
  player: CheckersPlayer
  type: PieceType
}

export type CheckersBoard = (CheckersPiece | null)[][]  // 8×8

export interface CheckersMove {
  from: [number, number]
  to: [number, number]
  captures: [number, number][]  // координаты съеденных шашек
  isKingMove: boolean
}

export interface CheckersState {
  board: CheckersBoard
  currentPlayer: CheckersPlayer
  humanPlayer: CheckersPlayer
  status: CheckersStatus
  winner: CheckersPlayer | null
  selectedCell: [number, number] | null
  validMoves: CheckersMove[]     // ходы для выбранной фигуры
  allMoves: CheckersMove[]       // все доступные ходы текущего игрока
  difficulty: CheckersDifficulty
  scores: Record<CheckersPlayer, number>
  startTime: number
  isBotThinking: boolean
  pieces: { black: number; white: number }  // количество шашек
  positionHistory?: string[]                // история хэшей позиций для правила 3-кратного повторения
}
