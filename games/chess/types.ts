// Типы для игры Шахматы (Chess)

export type ChessDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type ChessColor = 'w' | 'b'
export type GameMode = 'ai' | 'pvp'
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

export type ChessStatus =
  | 'in_progress'
  | 'checkmate'
  | 'draw'
  | 'stalemate'
  | 'threefold'
  | 'insufficient'

export interface ChessPieceInfo {
  type: PieceType
  color: ChessColor
}

export interface MoveHistoryItem {
  san: string
  from: string
  to: string
  piece: PieceType
  color: ChessColor
  captured?: PieceType
  check?: boolean
}

export interface CapturedPieces {
  w: PieceType[] // фигуры белых, захваченные чёрными
  b: PieceType[] // фигуры чёрных, захваченные белыми
}

export interface PendingPromotion {
  from: string
  to: string
}

export interface ChessState {
  fen: string
  turn: ChessColor
  status: ChessStatus
  winner: ChessColor | 'draw' | null
  isCheck: boolean
  selectedSquare: string | null
  validMoves: string[]
  lastMove: { from: string; to: string } | null
  history: MoveHistoryItem[]
  captured: CapturedPieces
  materialAdvantage: number // > 0: преимущество белых, < 0: преимущество чёрных
  difficulty: ChessDifficulty
  gameMode: GameMode
  playerColor: ChessColor
  isBotThinking: boolean
  pendingPromotion: PendingPromotion | null
  startTime: number
}
