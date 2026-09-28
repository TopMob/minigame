// ИИ для шашек — алгоритм Minimax с альфа-бета отсечением

import type { CheckersBoard, CheckersDifficulty, CheckersMove, CheckersPlayer } from './types'
import { BOARD_SIZE } from './engine'
import { getAllMoves, applyMoveToBoard } from './engine'

// Позиционная оценка клеток (центр лучше)
const POSITION_BONUS = [
  [0,  2,  0,  2,  0,  2,  0,  2],
  [2,  0,  3,  0,  3,  0,  3,  0],
  [0,  3,  0,  4,  0,  4,  0,  2],
  [2,  0,  4,  0,  6,  0,  4,  0],
  [0,  4,  0,  6,  0,  4,  0,  2],
  [2,  0,  4,  0,  4,  0,  3,  0],
  [0,  3,  0,  3,  0,  3,  0,  2],
  [2,  0,  2,  0,  2,  0,  2,  0],
]

function evaluateBoard(board: CheckersBoard, maximizingPlayer: CheckersPlayer): number {
  let score = 0
  const opponent: CheckersPlayer = maximizingPlayer === 'black' ? 'white' : 'black'

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c]
      if (!piece) continue
      const posBonus = POSITION_BONUS[r][c]
      const value = piece.type === 'king' ? 3 : 1

      if (piece.player === maximizingPlayer) {
        score += value * 10 + posBonus
        // Бонус за продвижение вперёд
        if (piece.type === 'man') {
          score += maximizingPlayer === 'black'
            ? r  // black движется вниз
            : (BOARD_SIZE - 1 - r)  // white движется вверх
        }
      } else {
        score -= value * 10 + posBonus
        if (piece.type === 'man') {
          score -= opponent === 'black' ? r : (BOARD_SIZE - 1 - r)
        }
      }
    }
  }

  return score
}

function isTerminal(board: CheckersBoard, player: CheckersPlayer): boolean {
  return getAllMoves(board, player).length === 0
}

/** Рекурсивный Minimax с альфа-бетой */
function minimax(
  board: CheckersBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botPlayer: CheckersPlayer,
  currentPlayer: CheckersPlayer
): number {
  if (depth === 0 || isTerminal(board, currentPlayer)) {
    if (isTerminal(board, currentPlayer)) {
      // Текущий игрок проиграл (нет ходов)
      return currentPlayer === botPlayer ? -50000 - depth : 50000 + depth
    }
    return evaluateBoard(board, botPlayer)
  }

  const moves = getAllMoves(board, currentPlayer)
  const nextPlayer: CheckersPlayer = currentPlayer === 'black' ? 'white' : 'black'

  if (isMaximizing) {
    let maxScore = -Infinity
    for (const move of moves) {
      const newBoard = applyMoveToBoard(board, move)
      const score = minimax(newBoard, depth - 1, alpha, beta, false, botPlayer, nextPlayer)
      maxScore = Math.max(maxScore, score)
      alpha = Math.max(alpha, score)
      if (alpha >= beta) break
    }
    return maxScore
  } else {
    let minScore = Infinity
    for (const move of moves) {
      const newBoard = applyMoveToBoard(board, move)
      const score = minimax(newBoard, depth - 1, alpha, beta, true, botPlayer, nextPlayer)
      minScore = Math.min(minScore, score)
      beta = Math.min(beta, score)
      if (alpha >= beta) break
    }
    return minScore
  }
}

function getDepth(difficulty: CheckersDifficulty): number {
  switch (difficulty) {
    case 'easy': return 2
    case 'medium': return 4
    case 'hard': return 6
  }
}

export function getCheckersMove(
  board: CheckersBoard,
  botPlayer: CheckersPlayer,
  difficulty: CheckersDifficulty
): CheckersMove | null {
  const moves = getAllMoves(board, botPlayer)
  if (moves.length === 0) return null

  // Лёгкий: случайный ход
  if (difficulty === 'easy' && Math.random() < 0.4) {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  // Лучший ход по Minimax
  let bestMove: CheckersMove | null = null
  let bestScore = -Infinity
  const depth = getDepth(difficulty)
  const nextPlayer: CheckersPlayer = botPlayer === 'black' ? 'white' : 'black'

  for (const move of moves) {
    const newBoard = applyMoveToBoard(board, move)
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, botPlayer, nextPlayer)
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
  }

  return bestMove
}
