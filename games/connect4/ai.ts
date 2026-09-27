// ИИ для игры 4 в ряд — алгоритм Minimax с альфа-бета отсечением

import type { Board, Connect4Difficulty, Connect4Player } from './types'
import { COLS, ROWS } from './types'
import {
  checkDraw,
  checkWin,
  dropPiece,
  getAvailableCols,
  getDropRow,
} from './engine'

// Позиционная оценка: центральные колонки ценнее
const POSITION_SCORES = [
  [3, 4, 5, 7, 5, 4, 3],
  [4, 6, 8, 10, 8, 6, 4],
  [5, 7, 11, 13, 11, 7, 5],
  [5, 7, 11, 13, 11, 7, 5],
  [4, 6, 8, 10, 8, 6, 4],
  [3, 4, 5, 7, 5, 4, 3],
]

/** Оценочная функция позиции */
function evaluateBoard(board: Board, maximizingPlayer: Connect4Player): number {
  const opponent: Connect4Player = maximizingPlayer === 'yellow' ? 'red' : 'yellow'
  let score = 0

  // Позиционные очки
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === maximizingPlayer) score += POSITION_SCORES[r][c]
      else if (board[r][c] === opponent) score -= POSITION_SCORES[r][c]
    }
  }

  // Оценка последовательностей
  function scoreWindow(window: (Connect4Player | null)[], player: Connect4Player): number {
    const opp: Connect4Player = player === 'yellow' ? 'red' : 'yellow'
    const pCount = window.filter((c) => c === player).length
    const eCount = window.filter((c) => c === null).length
    const oCount = window.filter((c) => c === opp).length

    if (pCount === 4) return 100
    if (pCount === 3 && eCount === 1) return 5
    if (pCount === 2 && eCount === 2) return 2
    if (oCount === 3 && eCount === 1) return -4
    return 0
  }

  function evalAllWindows(player: Connect4Player): number {
    let s = 0
    const SIZE = 4

    // Горизонталь
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - SIZE; c++) {
        s += scoreWindow(board[r].slice(c, c + SIZE), player)
      }
    }
    // Вертикаль
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= ROWS - SIZE; r++) {
        s += scoreWindow(Array.from({ length: SIZE }, (_, i) => board[r + i][c]), player)
      }
    }
    // Диагональ ↘
    for (let r = 0; r <= ROWS - SIZE; r++) {
      for (let c = 0; c <= COLS - SIZE; c++) {
        s += scoreWindow(Array.from({ length: SIZE }, (_, i) => board[r + i][c + i]), player)
      }
    }
    // Диагональ ↙
    for (let r = 0; r <= ROWS - SIZE; r++) {
      for (let c = SIZE - 1; c < COLS; c++) {
        s += scoreWindow(Array.from({ length: SIZE }, (_, i) => board[r + i][c - i]), player)
      }
    }
    return s
  }

  score += evalAllWindows(maximizingPlayer)
  score -= evalAllWindows(opponent)
  return score
}

function isTerminal(board: Board): boolean {
  if (checkDraw(board)) return true
  // Проверяем победу любого игрока
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== null) {
        const [win] = checkWin(board, r, c)
        if (win) return true
      }
    }
  }
  return false
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botPlayer: Connect4Player,
  humanPlayer: Connect4Player
): [number, number] {
  const available = getAvailableCols(board)

  if (depth === 0 || isTerminal(board)) {
    if (isTerminal(board)) {
      // Проверяем кто выиграл
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (board[r][c] !== null) {
            const [win] = checkWin(board, r, c)
            if (win) {
              return [board[r][c] === botPlayer ? 100000 + depth : -(100000 + depth), -1]
            }
          }
        }
      }
      return [0, -1] // ничья
    }
    return [evaluateBoard(board, botPlayer), -1]
  }

  let bestCol = available[Math.floor(available.length / 2)] // центр как дефолт

  if (isMaximizing) {
    let maxScore = -Infinity
    for (const col of available) {
      const [newBoard, row] = dropPiece(board, col, botPlayer)
      if (row === -1) continue
      const [score] = minimax(newBoard, depth - 1, alpha, beta, false, botPlayer, humanPlayer)
      if (score > maxScore) { maxScore = score; bestCol = col }
      alpha = Math.max(alpha, score)
      if (alpha >= beta) break
    }
    return [maxScore, bestCol]
  } else {
    let minScore = Infinity
    for (const col of available) {
      const [newBoard, row] = dropPiece(board, col, humanPlayer)
      if (row === -1) continue
      const [score] = minimax(newBoard, depth - 1, alpha, beta, true, botPlayer, humanPlayer)
      if (score < minScore) { minScore = score; bestCol = col }
      beta = Math.min(beta, score)
      if (alpha >= beta) break
    }
    return [minScore, bestCol]
  }
}

function getDepth(difficulty: Connect4Difficulty): number {
  switch (difficulty) {
    case 'easy': return 2
    case 'medium': return 4
    case 'hard': return 7
  }
}

export function getBotMove(
  board: Board,
  botPlayer: Connect4Player,
  difficulty: Connect4Difficulty
): number {
  const humanPlayer: Connect4Player = botPlayer === 'red' ? 'yellow' : 'red'
  const available = getAvailableCols(board)
  if (available.length === 0) return -1

  // На лёгком уровне: 35% случайных ходов
  if (difficulty === 'easy' && Math.random() < 0.35) {
    return available[Math.floor(Math.random() * available.length)]
  }

  // Быстрая проверка: можем ли выиграть немедленно?
  for (const col of available) {
    const row = getDropRow(board, col)
    if (row === -1) continue
    const [newBoard] = dropPiece(board, col, botPlayer)
    const [win] = checkWin(newBoard, row, col)
    if (win) return col
  }

  // Быстрая проверка: блокируем немедленную победу противника
  for (const col of available) {
    const row = getDropRow(board, col)
    if (row === -1) continue
    const [newBoard] = dropPiece(board, col, humanPlayer)
    const [win] = checkWin(newBoard, row, col)
    if (win) return col
  }

  const depth = getDepth(difficulty)
  const [, bestCol] = minimax(board, depth, -Infinity, Infinity, true, botPlayer, humanPlayer)
  return bestCol !== -1 ? bestCol : available[0]
}
