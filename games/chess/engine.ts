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
export function calculateCapturedAndAdvantage(
  chess: Chess,
  historyMoves?: MoveHistoryItem[]
): {
  captured: CapturedPieces
  advantage: number
} {
  const captured: CapturedPieces = {
    w: [], // Белые фигуры, захваченные чёрными
    b: [], // Чёрные фигуры, захваченные белыми
  }

  if (historyMoves) {
    for (const item of historyMoves) {
      if (item.captured) {
        if (item.color === 'w') {
          captured.b.push(item.captured)
        } else {
          captured.w.push(item.captured)
        }
      }
    }
  } else {
    try {
      const verboseHistory = chess.history({ verbose: true })
      for (const m of verboseHistory) {
        if (m.captured) {
          if (m.color === 'w') {
            captured.b.push(m.captured as PieceType)
          } else {
            captured.w.push(m.captured as PieceType)
          }
        }
      }
    } catch {}
  }

  const pieceRank: Record<PieceType, number> = { q: 5, r: 4, b: 3, n: 2, p: 1, k: 0 }
  captured.w.sort((a, b) => pieceRank[b] - pieceRank[a])
  captured.b.sort((a, b) => pieceRank[b] - pieceRank[a])

  let whiteMaterial = 0
  let blackMaterial = 0
  const board = chess.board()
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        const val = PIECE_WEIGHTS[piece.type] || 0
        if (piece.color === 'w') whiteMaterial += val
        else blackMaterial += val
      }
    }
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

    const historyItem: MoveHistoryItem = {
      san: moveResult.san,
      from: moveResult.from,
      to: moveResult.to,
      piece: pieceBefore?.type || 'p',
      color: moveResult.color,
      captured: moveResult.captured as PieceType | undefined,
      check: isCheck,
    }

    const newHistory = [...state.history, historyItem]
    const { captured, advantage } = calculateCapturedAndAdvantage(chess, newHistory)

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
      history: newHistory,
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
    const isBotTurn = state.gameMode === 'ai' && state.turn !== state.playerColor
    const stepsToUndo = state.gameMode === 'ai' && !isBotTurn && state.history.length >= 2 ? 2 : 1
    const newHistoryCount = Math.max(0, state.history.length - stepsToUndo)
    const newHistory = state.history.slice(0, newHistoryCount)

    // Воспроизводим партию до нужного хода
    for (let i = 0; i < newHistoryCount; i++) {
      chess.move(newHistory[i].san)
    }

    const { captured, advantage } = calculateCapturedAndAdvantage(chess, newHistory)
    const lastItem = newHistoryCount > 0 ? newHistory[newHistoryCount - 1] : null

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
      history: newHistory,
      captured,
      materialAdvantage: advantage,
      pendingPromotion: null,
      isBotThinking: false,
    }
  } catch {
    return state
  }
}
