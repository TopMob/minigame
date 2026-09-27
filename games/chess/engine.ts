// Движок игры Шахматы на базе chess.js
import { Chess, Square, PieceSymbol } from 'chess.js'
import type {
  ChessColor,
  ChessDifficulty,
  ChessState,
  GameMode,
  MoveHistoryItem,
  PieceType,
  CapturedPieces,
} from './types'

const PIECE_WEIGHTS: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
}

// Расчёт захваченных фигур и материального преимущества
export function calculateCapturedAndAdvantage(chess: Chess): {
  captured: CapturedPieces
  advantage: number
} {
  const initialCounts: Record<ChessColor, Record<PieceType, number>> = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  }

  const currentCounts: Record<ChessColor, Record<PieceType, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  }

  const board = chess.board()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        currentCounts[piece.color][piece.type]++
      }
    }
  }

  const captured: CapturedPieces = {
    w: [], // Белые фигуры, захваченные чёрными
    b: [], // Чёрные фигуры, захваченные белыми
  }

  const pieceOrder: PieceType[] = ['q', 'r', 'b', 'n', 'p']

  let whiteMaterial = 0
  let blackMaterial = 0

  for (const type of pieceOrder) {
    const missingWhite = Math.max(0, initialCounts.w[type] - currentCounts.w[type])
    for (let i = 0; i < missingWhite; i++) {
      captured.w.push(type)
    }

    const missingBlack = Math.max(0, initialCounts.b[type] - currentCounts.b[type])
    for (let i = 0; i < missingBlack; i++) {
      captured.b.push(type)
    }

    whiteMaterial += currentCounts.w[type] * PIECE_WEIGHTS[type]
    blackMaterial += currentCounts.b[type] * PIECE_WEIGHTS[type]
  }

  return {
    captured,
    advantage: whiteMaterial - blackMaterial,
  }
}

// Создание начального состояния игры
export function createInitialChessState(
  difficulty: ChessDifficulty = 'medium',
  gameMode: GameMode = 'ai',
  playerColor: ChessColor = 'w'
): ChessState {
  const chess = new Chess()
  const { captured, advantage } = calculateCapturedAndAdvantage(chess)

  return {
    fen: chess.fen(),
    turn: 'w',
    status: 'in_progress',
    winner: null,
    isCheck: false,
    selectedSquare: null,
    validMoves: [],
    lastMove: null,
    history: [],
    captured,
    materialAdvantage: advantage,
    difficulty,
    gameMode,
    playerColor,
    isBotThinking: false,
    pendingPromotion: null,
    startTime: Date.now(),
  }
}

// Получение легальных ходов для выбранной клетки
export function getValidMovesForSquare(fen: string, square: string): string[] {
  try {
    const chess = new Chess(fen)
    const moves = chess.moves({ square: square as Square, verbose: true })
    return moves.map((m) => m.to)
  } catch {
    return []
  }
}

// Проверка: является ли ход превращением пешки
export function isPawnPromotion(fen: string, from: string, to: string): boolean {
  try {
    const chess = new Chess(fen)
    const piece = chess.get(from as Square)
    if (!piece || piece.type !== 'p') return false

    const toRank = to[1]
    return (piece.color === 'w' && toRank === '8') || (piece.color === 'b' && toRank === '1')
  } catch {
    return false
  }
}

// Применение хода
export function executeMove(
  state: ChessState,
  from: string,
  to: string,
  promotion: PieceSymbol = 'q'
): {
  nextState: ChessState
  isSuccess: boolean
  isCapture: boolean
  isCheck: boolean
} {
  try {
    const chess = new Chess(state.fen)
    const pieceBefore = chess.get(from as Square)

    const moveResult = chess.move({
      from: from as Square,
      to: to as Square,
      promotion,
    })

    if (!moveResult) {
      return { nextState: state, isSuccess: false, isCapture: false, isCheck: false }
    }

    const isCheck = chess.inCheck()
    const isCheckmate = chess.isCheckmate()
    const isStalemate = chess.isStalemate()
    const isThreefold = chess.isThreefoldRepetition()
    const isInsufficient = chess.isInsufficientMaterial()
    const isDraw = chess.isDraw()

    let status: ChessState['status'] = 'in_progress'
    let winner: ChessState['winner'] = null

    if (isCheckmate) {
      status = 'checkmate'
      winner = moveResult.color // игрок, сделавший матующий ход, победил
    } else if (isStalemate) {
      status = 'stalemate'
      winner = 'draw'
    } else if (isThreefold) {
      status = 'threefold'
      winner = 'draw'
    } else if (isInsufficient) {
      status = 'insufficient'
      winner = 'draw'
    } else if (isDraw) {
      status = 'draw'
      winner = 'draw'
    }

    const { captured, advantage } = calculateCapturedAndAdvantage(chess)

    const historyItem: MoveHistoryItem = {
      san: moveResult.san,
      from: moveResult.from,
      to: moveResult.to,
      piece: pieceBefore?.type || 'p',
      color: moveResult.color,
      captured: moveResult.captured as PieceType | undefined,
      check: isCheck,
    }

    const nextState: ChessState = {
      ...state,
      fen: chess.fen(),
      turn: chess.turn() as ChessColor,
      status,
      winner,
      isCheck,
      selectedSquare: null,
      validMoves: [],
      lastMove: { from: moveResult.from, to: moveResult.to },
      history: [...state.history, historyItem],
      captured,
      materialAdvantage: advantage,
      pendingPromotion: null,
      isBotThinking: false,
    }

    return {
      nextState,
      isSuccess: true,
      isCapture: !!moveResult.captured,
      isCheck,
    }
  } catch {
    return { nextState: state, isSuccess: false, isCapture: false, isCheck: false }
  }
}

// Отмена последнего хода (или 2 ходов при игре против бота)
export function undoLastMove(state: ChessState): ChessState {
  if (state.history.length === 0) return state

  try {
    const chess = new Chess()
    const stepsToUndo = state.gameMode === 'ai' && state.history.length >= 2 ? 2 : 1
    const newHistoryCount = state.history.length - stepsToUndo

    // Воспроизводим партию до нужного хода
    for (let i = 0; i < newHistoryCount; i++) {
      chess.move(state.history[i].san)
    }

    const { captured, advantage } = calculateCapturedAndAdvantage(chess)
    const lastItem = newHistoryCount > 0 ? state.history[newHistoryCount - 1] : null

    return {
      ...state,
      fen: chess.fen(),
      turn: chess.turn() as ChessColor,
      status: 'in_progress',
      winner: null,
      isCheck: chess.inCheck(),
      selectedSquare: null,
      validMoves: [],
      lastMove: lastItem ? { from: lastItem.from, to: lastItem.to } : null,
      history: state.history.slice(0, newHistoryCount),
      captured,
      materialAdvantage: advantage,
      pendingPromotion: null,
      isBotThinking: false,
    }
  } catch {
    return state
  }
}
