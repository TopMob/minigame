import {
  cloneBoard,
  countPieces,
  getFlipsForMove,
  getOpponent,
  getValidMoves,
} from './engine'
import {
  BOARD_SIZE,
  type ReversiBoard,
  type ReversiDifficulty,
  type ReversiMove,
  type ReversiPlayer,
} from './types'

// Классическая позиционная матрица весов Отелло
// Углы бесценны (+100), клетки рядом с пустыми углами крайне опасны (-20..-40)
const POSITIONAL_WEIGHTS: number[][] = [
  [ 100, -25,  10,   5,   5,  10, -25,  100],
  [ -25, -45,   1,   1,   1,   1, -45,  -25],
  [  10,   1,   5,   2,   2,   5,   1,   10],
  [   5,   1,   2,   1,   1,   2,   1,    5],
  [   5,   1,   2,   1,   1,   2,   1,    5],
  [  10,   1,   5,   2,   2,   5,   1,   10],
  [ -25, -45,   1,   1,   1,   1, -45,  -25],
  [ 100, -25,  10,   5,   5,  10, -25,  100],
]

// Координаты углов и связанных с ними X- и C-клеток
const CORNERS: [number, number][] = [
  [0, 0], [0, 7], [7, 0], [7, 7]
]

// Проверка, занят ли угол, чтобы нейтрализовать штраф соседних клеток
function getDynamicPositionalScore(board: ReversiBoard, player: ReversiPlayer): number {
  const opponent = getOpponent(player)
  let score = 0

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c]
      if (!cell) continue

      let weight = POSITIONAL_WEIGHTS[r][c]

      // Смягчение штрафов клеток возле углов, если угол уже занят
      const nearCorners = [
        { corner: [0, 0], neighbors: [[0, 1], [1, 0], [1, 1]] },
        { corner: [0, 7], neighbors: [[0, 6], [1, 7], [1, 6]] },
        { corner: [7, 0], neighbors: [[6, 0], [7, 1], [6, 1]] },
        { corner: [7, 7], neighbors: [[7, 6], [6, 7], [6, 6]] },
      ]

      for (const { corner, neighbors } of nearCorners) {
        if (board[corner[0]][corner[1]] === cell) {
          if (neighbors.some(([nr, nc]) => nr === r && nc === c)) {
            weight = Math.max(weight, 5) // Уже не штрафуется
          }
        }
      }

      if (cell === player) {
        score += weight
      } else if (cell === opponent) {
        score -= weight
      }
    }
  }

  return score
}

// Оценка подвижности (мобильности) игроков
function evaluateMobility(
  board: ReversiBoard,
  player: ReversiPlayer,
  opponent: ReversiPlayer
): number {
  const playerMoves = getValidMoves(board, player).length
  const opponentMoves = getValidMoves(board, opponent).length

  if (playerMoves + opponentMoves === 0) return 0
  return (100 * (playerMoves - opponentMoves)) / (playerMoves + opponentMoves)
}

// Комплексная функция оценки позиции
function evaluateBoard(
  board: ReversiBoard,
  player: ReversiPlayer,
  emptyCount: number
): number {
  const opponent = getOpponent(player)
  const pieces = countPieces(board)

  // Если игра закончена
  const playerMoves = getValidMoves(board, player)
  const opponentMoves = getValidMoves(board, opponent)
  if (playerMoves.length === 0 && opponentMoves.length === 0) {
    if (pieces[player] > pieces[opponent]) return 10000 + (pieces[player] - pieces[opponent]) * 50
    if (pieces[player] < pieces[opponent]) return -10000 - (pieces[opponent] - pieces[player]) * 50
    return 0
  }

  // Эндшпиль (осталось мало пустых клеток): чистый подсчет фишек
  if (emptyCount <= 12) {
    return (pieces[player] - pieces[opponent]) * 100
  }

  // Миттельшпиль / Дебют: взвешенная комбинация позиции и мобильности
  const posScore = getDynamicPositionalScore(board, player)
  const mobilityScore = evaluateMobility(board, player, opponent)
  const pieceDiff = pieces[player] - pieces[opponent]

  return posScore * 1.5 + mobilityScore * 2.0 + pieceDiff * 0.5
}

function simulateMove(
  board: ReversiBoard,
  move: ReversiMove,
  player: ReversiPlayer
): ReversiBoard {
  const nextBoard = cloneBoard(board)
  nextBoard[move.row][move.col] = player
  for (const [fr, fc] of move.flips) {
    nextBoard[fr][fc] = player
  }
  return nextBoard
}

// Сортировка ходов для ускорения альфа-бета отсечения
function orderMoves(moves: ReversiMove[], board: ReversiBoard, player: ReversiPlayer): ReversiMove[] {
  return [...moves].sort((a, b) => {
    const weightA = POSITIONAL_WEIGHTS[a.row][a.col]
    const weightB = POSITIONAL_WEIGHTS[b.row][b.col]
    return weightB - weightA
  })
}

// Минимакс с альфа-бета отсечением
function minimax(
  board: ReversiBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: ReversiPlayer,
  emptyCount: number
): number {
  const currentPlayer = isMaximizing ? aiPlayer : getOpponent(aiPlayer)
  const validMoves = getValidMoves(board, currentPlayer)

  if (depth === 0 || emptyCount === 0) {
    return evaluateBoard(board, aiPlayer, emptyCount)
  }

  if (validMoves.length === 0) {
    // Пропуск хода
    const nextOpponent = getOpponent(currentPlayer)
    const opponentMoves = getValidMoves(board, nextOpponent)
    if (opponentMoves.length === 0) {
      // Конец игры
      return evaluateBoard(board, aiPlayer, emptyCount)
    }
    // Передаем ход дальше без уменьшения глубины (или уменьшаем на 1)
    return minimax(board, depth - 1, alpha, beta, !isMaximizing, aiPlayer, emptyCount)
  }

  const sortedMoves = orderMoves(validMoves, board, currentPlayer)

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of sortedMoves) {
      const nextBoard = simulateMove(board, move, currentPlayer)
      const evaluation = minimax(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
        emptyCount - 1
      )
      maxEval = Math.max(maxEval, evaluation)
      alpha = Math.max(alpha, evaluation)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of sortedMoves) {
      const nextBoard = simulateMove(board, move, currentPlayer)
      const evaluation = minimax(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer,
        emptyCount - 1
      )
      minEval = Math.min(minEval, evaluation)
      beta = Math.min(beta, evaluation)
      if (beta <= alpha) break
    }
    return minEval
  }
}

// Главная точка входа для хода бота
export function getBotMove(
  board: ReversiBoard,
  botPlayer: ReversiPlayer,
  difficulty: ReversiDifficulty
): ReversiMove | null {
  const validMoves = getValidMoves(board, botPlayer)
  if (validMoves.length === 0) return null
  if (validMoves.length === 1) return validMoves[0]

  // Подсчёт свободных клеток
  let emptyCount = 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) emptyCount++
    }
  }

  // --- ЛЁГКИЙ УРОВЕНЬ ---
  // 40% случайный ход, 60% жадный (максимум переворотов)
  if (difficulty === 'easy') {
    if (Math.random() < 0.4) {
      return validMoves[Math.floor(Math.random() * validMoves.length)]
    }
    // Жадный ход
    return validMoves.reduce((best, m) =>
      m.flips.length > best.flips.length ? m : best
    )
  }

  // --- СРЕДНИЙ УРОВЕНЬ ---
  // Minimax глубина 3
  if (difficulty === 'medium') {
    const depth = 3
    let bestMove = validMoves[0]
    let bestScore = -Infinity

    const ordered = orderMoves(validMoves, board, botPlayer)
    for (const move of ordered) {
      const nextBoard = simulateMove(board, move, botPlayer)
      const score = minimax(
        nextBoard,
        depth - 1,
        -Infinity,
        Infinity,
        false,
        botPlayer,
        emptyCount - 1
      )
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }
    return bestMove
  }

  // --- СЛОЖНЫЙ УРОВЕНЬ ---
  // Minimax глубина 5. Если осталось <= 10 пустых клеток, до конца партии!
  const depth = emptyCount <= 10 ? emptyCount : 5
  let bestMove = validMoves[0]
  let bestScore = -Infinity
  let alpha = -Infinity
  const beta = Infinity

  const ordered = orderMoves(validMoves, board, botPlayer)
  for (const move of ordered) {
    const nextBoard = simulateMove(board, move, botPlayer)
    const score = minimax(
      nextBoard,
      depth - 1,
      alpha,
      beta,
      false,
      botPlayer,
      emptyCount - 1
    )
    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
    alpha = Math.max(alpha, bestScore)
  }

  return bestMove
}
