import type { Board, Difficulty, Player } from './types'

export const WINNING_COMBINATIONS: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export function checkBoardWinner(board: Board): { winner: Player | null; line: [number, number, number] | null } {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] }
    }
  }
  return { winner: null, line: null }
}

export function getAvailableMoves(board: Board): number[] {
  const moves: number[] = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      moves.push(i)
    }
  }
  return moves
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  botSign: Player,
  humanSign: Player
): { score: number; bestMove?: number } {
  const { winner } = checkBoardWinner(board)

  if (winner === botSign) return { score: 10 - depth }
  if (winner === humanSign) return { score: depth - 10 }

  const availableMoves = getAvailableMoves(board)
  if (availableMoves.length === 0) return { score: 0 }

  if (isMaximizing) {
    let maxScore = -Infinity
    let bestMove = availableMoves[0]

    for (const move of availableMoves) {
      board[move] = botSign
      const result = minimax(board, depth + 1, false, botSign, humanSign)
      board[move] = null

      if (result.score > maxScore) {
        maxScore = result.score
        bestMove = move
      }
    }
    return { score: maxScore, bestMove }
  } else {
    let minScore = Infinity
    let bestMove = availableMoves[0]

    for (const move of availableMoves) {
      board[move] = humanSign
      const result = minimax(board, depth + 1, true, botSign, humanSign)
      board[move] = null

      if (result.score < minScore) {
        minScore = result.score
        bestMove = move
      }
    }
    return { score: minScore, bestMove }
  }
}

export function getBotMove(board: Board, botSign: Player, difficulty: Difficulty): number {
  const humanSign: Player = botSign === 'X' ? 'O' : 'X'
  const availableMoves = getAvailableMoves(board)

  if (availableMoves.length === 0) return -1

  // Если это первый ход и бот ходит первым или вторым в центр
  if (availableMoves.length === 9) {
    // Выбираем центр или углы
    const firstMoves = [0, 2, 4, 6, 8]
    return firstMoves[Math.floor(Math.random() * firstMoves.length)]
  }

  // 1. Легкий уровень: 80% случайных ходов, 20% умных
  if (difficulty === 'easy') {
    if (Math.random() < 0.8) {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }
  }

  // 2. Средний уровень:
  // Проверяем возможность победить в 1 ход или заблокировать победу соперника
  if (difficulty === 'medium') {
    // Может ли бот выиграть прямо сейчас?
    for (const move of availableMoves) {
      board[move] = botSign
      const { winner } = checkBoardWinner(board)
      board[move] = null
      if (winner === botSign) return move
    }

    // Нужно ли блокировать победу игрока?
    for (const move of availableMoves) {
      board[move] = humanSign
      const { winner } = checkBoardWinner(board)
      board[move] = null
      if (winner === humanSign) return move
    }

    // С вероятностью 45% делаем случайный ход, иначе Minimax
    if (Math.random() < 0.45) {
      // Приоритет центра
      if (board[4] === null && Math.random() < 0.5) return 4
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }
  }

  // 3. Сложный уровень: чистый непобедимый Minimax
  const { bestMove } = minimax(board, 0, true, botSign, humanSign)
  return bestMove !== undefined ? bestMove : availableMoves[0]
}
