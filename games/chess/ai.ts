// Искусственный интеллект для шахмат на базе Minimax с альфа-бета отсечением
// и оценкой позиций по таблицам ценности полей (Piece-Square Tables)

import { Chess } from 'chess.js'
import type { ChessDifficulty } from './types'

// Базовые ценности фигур в сантипешках
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
}

// Таблицы ценности полей (Piece-Square Tables) для белых (0-я строка — 8-я горизонталь, 7-я строка — 1-я горизонталь)
const PAWN_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
]

const KNIGHT_PST = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
]

const BISHOP_PST = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
]

const ROOK_PST = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
]

const QUEEN_PST = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
]

const KING_MIDGAME_PST = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
]

function getPieceSquareValue(pieceType: string, color: 'w' | 'b', row: number, col: number): number {
  const r = color === 'w' ? row : 7 - row
  const c = color === 'w' ? col : 7 - col

  switch (pieceType) {
    case 'p':
      return PAWN_PST[r]?.[c] ?? 0
    case 'n':
      return KNIGHT_PST[r]?.[c] ?? 0
    case 'b':
      return BISHOP_PST[r]?.[c] ?? 0
    case 'r':
      return ROOK_PST[r]?.[c] ?? 0
    case 'q':
      return QUEEN_PST[r]?.[c] ?? 0
    case 'k':
      return KING_MIDGAME_PST[r]?.[c] ?? 0
    default:
      return 0
  }
}

// Оценка позиции: положительная для белых, отрицательная для чёрных
export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial()) {
    return 0
  }

  let score = 0
  const board = chess.board()

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece) continue

      const baseVal = PIECE_VALUES[piece.type] || 0
      const posVal = getPieceSquareValue(piece.type, piece.color, r, c)
      const total = baseVal + posVal

      if (piece.color === 'w') {
        score += total
      } else {
        score -= total
      }
    }
  }

  // Бонус за мобильность (количество легальных ходов)
  const mobility = chess.moves().length
  score += (chess.turn() === 'w' ? 1 : -1) * mobility * 3

  return score
}

// Сортировка ходов для оптимизации альфа-бета отсечения
// MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
interface VerboseMove {
  from: string
  to: string
  piece: string
  captured?: string
  promotion?: string
  san: string
}

function orderMoves(moves: VerboseMove[]): VerboseMove[] {
  return moves.slice().sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    if (a.captured) {
      scoreA += (PIECE_VALUES[a.captured] || 0) * 10 - (PIECE_VALUES[a.piece] || 0)
    }
    if (a.promotion) {
      scoreA += (PIECE_VALUES[a.promotion] || 0)
    }
    if (a.san.includes('+')) {
      scoreA += 50
    }

    if (b.captured) {
      scoreB += (PIECE_VALUES[b.captured] || 0) * 10 - (PIECE_VALUES[b.piece] || 0)
    }
    if (b.promotion) {
      scoreB += (PIECE_VALUES[b.promotion] || 0)
    }
    if (b.san.includes('+')) {
      scoreB += 50
    }

    return scoreB - scoreA
  })
}

// Quiescence search (поиск по взятиям) для предотвращения эффекта горизонта
function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  maxQDepth: number
): number {
  const standPat = evaluateBoard(chess)

  if (maxQDepth <= 0) return standPat

  if (isMaximizing) {
    if (standPat >= beta) return beta
    if (standPat > alpha) alpha = standPat

    const captureMoves = orderMoves(
      chess.moves({ verbose: true }).filter((m) => !!m.captured) as unknown as VerboseMove[]
    )

    for (const move of captureMoves) {
      chess.move(move)
      const score = quiescence(chess, alpha, beta, false, maxQDepth - 1)
      chess.undo()

      if (score >= beta) return beta
      if (score > alpha) alpha = score
    }
    return alpha
  } else {
    if (standPat <= alpha) return alpha
    if (standPat < beta) beta = standPat

    const captureMoves = orderMoves(
      chess.moves({ verbose: true }).filter((m) => !!m.captured) as unknown as VerboseMove[]
    )

    for (const move of captureMoves) {
      chess.move(move)
      const score = quiescence(chess, alpha, beta, true, maxQDepth - 1)
      chess.undo()

      if (score <= alpha) return alpha
      if (score < beta) beta = score
    }
    return beta
  }
}

// Основной Minimax с альфа-бета отсечением
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  useQuiescence: boolean = false
): number {
  if (depth === 0) {
    if (useQuiescence) {
      return quiescence(chess, alpha, beta, isMaximizing, 2)
    }
    return evaluateBoard(chess)
  }

  if (chess.isGameOver()) {
    return evaluateBoard(chess)
  }

  const moves = orderMoves(chess.moves({ verbose: true }) as unknown as VerboseMove[])

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      chess.move(move)
      const evalScore = minimax(chess, depth - 1, alpha, beta, false, useQuiescence)
      chess.undo()
      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      chess.move(move)
      const evalScore = minimax(chess, depth - 1, alpha, beta, true, useQuiescence)
      chess.undo()
      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)
      if (beta <= alpha) break
    }
    return minEval
  }
}

// Получение хода бота в зависимости от сложности
export function getBestMove(
  fen: string,
  difficulty: ChessDifficulty
): { from: string; to: string; promotion?: string } | null {
  const chess = new Chess(fen)
  const isMaximizing = chess.turn() === 'w'
  const rawMoves = chess.moves({ verbose: true }) as unknown as VerboseMove[]

  if (rawMoves.length === 0) return null

  // Легкий уровень: 25% случайный ход, иначе глубина 1 с небольшим шумом
  if (difficulty === 'easy') {
    if (Math.random() < 0.3) {
      const randomMove = rawMoves[Math.floor(Math.random() * rawMoves.length)]
      return { from: randomMove.from, to: randomMove.to, promotion: 'q' }
    }

    const scoredMoves = rawMoves.map((m) => {
      chess.move(m)
      const score = evaluateBoard(chess) + (Math.random() * 50 - 25)
      chess.undo()
      return { move: m, score }
    })

    scoredMoves.sort((a, b) =>
      isMaximizing ? b.score - a.score : a.score - b.score
    )

    // Берём из топ-3
    const pickIndex = Math.min(
      Math.floor(Math.random() * 3),
      scoredMoves.length - 1
    )
    const chosen = scoredMoves[pickIndex].move
    return { from: chosen.from, to: chosen.to, promotion: 'q' }
  }

  // Средний уровень: глубина 2 с альфа-бета
  if (difficulty === 'medium') {
    const depth = 2
    const moves = orderMoves(rawMoves)
    let bestMove = moves[0]
    let bestScore = isMaximizing ? -Infinity : Infinity

    for (const move of moves) {
      chess.move(move)
      const score = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing, false)
      chess.undo()

      if (isMaximizing ? score > bestScore : score < bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return { from: bestMove.from, to: bestMove.to, promotion: 'q' }
  }

  // Сложный уровень: глубина 3
  if (difficulty === 'hard') {
    const depth = 3
    const moves = orderMoves(rawMoves)
    let bestMove = moves[0]
    let bestScore = isMaximizing ? -Infinity : Infinity

    for (const move of moves) {
      chess.move(move)
      const score = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing, false)
      chess.undo()

      if (isMaximizing ? score > bestScore : score < bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return { from: bestMove.from, to: bestMove.to, promotion: 'q' }
  }

  // Эксперт: глубина 3 с Quiescence Search (поиск форсированных взятий)
  const depth = 3
  const moves = orderMoves(rawMoves)
  let bestMove = moves[0]
  let bestScore = isMaximizing ? -Infinity : Infinity

  for (const move of moves) {
    chess.move(move)
    const score = minimax(chess, depth - 1, -Infinity, Infinity, !isMaximizing, true)
    chess.undo()

    if (isMaximizing ? score > bestScore : score < bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return { from: bestMove.from, to: bestMove.to, promotion: 'q' }
}
