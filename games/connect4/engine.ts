// Движок игры 4 в ряд — чистый TypeScript

import type {
  Board,
  Connect4Difficulty,
  Connect4Mode,
  Connect4Player,
  Connect4State,
  Connect4Status,
} from './types'
import { COLS, ROWS } from './types'

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(null))
}

export function createConnect4State(
  mode: Connect4Mode = 'vs-bot',
  difficulty: Connect4Difficulty = 'medium'
): Connect4State {
  return {
    board: emptyBoard(),
    currentPlayer: 'red',
    humanPlayer: 'red',
    status: 'in_progress',
    winner: null,
    winningCells: [],
    difficulty,
    mode,
    scores: { red: 0, yellow: 0 },
    startTime: Date.now(),
    isBotThinking: false,
  }
}

/** Найти первую свободную строку в колонке (возвращает -1 если полная) */
export function getDropRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row
  }
  return -1
}

/** Получить список доступных ходов */
export function getAvailableCols(board: Board): number[] {
  return Array.from({ length: COLS }, (_, c) => c).filter((c) => getDropRow(board, c) !== -1)
}

/** Опустить фишку в колонку — возвращает новое поле и координаты */
export function dropPiece(board: Board, col: number, player: Connect4Player): [Board, number, number] {
  const row = getDropRow(board, col)
  if (row === -1) return [board, -1, -1]

  const newBoard = board.map((r, ri) =>
    r.map((cell, ci) => (ri === row && ci === col ? player : cell))
  )
  return [newBoard, row, col]
}

/** Проверить победу — ищет 4 в ряд от последнего хода */
export function checkWin(board: Board, row: number, col: number): [boolean, [number, number][]] {
  const player = board[row][col]
  if (!player) return [false, []]

  const directions: [number, number][] = [
    [0, 1],   // горизонталь
    [1, 0],   // вертикаль
    [1, 1],   // диагональ ↘
    [1, -1],  // диагональ ↙
  ]

  for (const [dr, dc] of directions) {
    const cells: [number, number][] = [[row, col]]

    for (const sign of [1, -1]) {
      let r = row + dr * sign
      let c = col + dc * sign
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
        cells.push([r, c])
        r += dr * sign
        c += dc * sign
      }
    }

    if (cells.length >= 4) return [true, cells]
  }

  return [false, []]
}

/** Проверить ничью */
export function checkDraw(board: Board): boolean {
  return getAvailableCols(board).length === 0
}

/** Применить ход игрока */
export function applyPlayerMove(state: Connect4State, col: number): Connect4State {
  if (state.status !== 'in_progress') return state
  if (getDropRow(state.board, col) === -1) return state

  const [newBoard, row] = dropPiece(state.board, col, state.currentPlayer)
  const [isWin, winCells] = checkWin(newBoard, row, col)
  const isDraw = !isWin && checkDraw(newBoard)

  const winner = isWin ? state.currentPlayer : null
  const newScores = isWin
    ? { ...state.scores, [state.currentPlayer]: state.scores[state.currentPlayer] + 1 }
    : state.scores

  const nextPlayer: Connect4Player = state.currentPlayer === 'red' ? 'yellow' : 'red'
  const status: Connect4Status = isWin ? 'won' : isDraw ? 'draw' : 'in_progress'

  return {
    ...state,
    board: newBoard,
    currentPlayer: status === 'in_progress' ? nextPlayer : state.currentPlayer,
    winner,
    winningCells: isWin ? winCells : [],
    status,
    scores: newScores,
    isBotThinking: false,
  }
}

/** Сброс к новой партии (сохраняем счёт) */
export function resetConnect4(state: Connect4State): Connect4State {
  return {
    ...createConnect4State(state.mode, state.difficulty),
    scores: state.scores,
    humanPlayer: state.humanPlayer,
  }
}
