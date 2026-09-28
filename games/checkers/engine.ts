// Движок игры Шашки (русские правила) — чистый TypeScript
// Правила: 8×8, 12 шашек у каждой стороны, обязательное взятие,
// дамка ходит на любое расстояние, цепочные прыжки, превращение в дамку

import type {
  CheckersBoard,
  CheckersDifficulty,
  CheckersMove,
  CheckersPlayer,
  CheckersState,
} from './types'

export const BOARD_SIZE = 8

/** Создать начальную расстановку */
function createInitialBoard(): CheckersBoard {
  const board: CheckersBoard = Array.from({ length: BOARD_SIZE }, () =>
    new Array(BOARD_SIZE).fill(null)
  )

  // Black (чёрные) сверху — строки 0-2
  // White (белые) снизу — строки 5-7
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        if (row < 3) board[row][col] = { player: 'black', type: 'man' }
        if (row > 4) board[row][col] = { player: 'white', type: 'man' }
      }
    }
  }

  return board
}

function countPieces(board: CheckersBoard): { black: number; white: number } {
  let black = 0, white = 0
  for (const row of board) {
    for (const cell of row) {
      if (cell?.player === 'black') black++
      else if (cell?.player === 'white') white++
    }
  }
  return { black, white }
}

export function hashCheckersPosition(board: CheckersBoard, player: CheckersPlayer): string {
  let s = player + ':'
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const p = board[r][c]
      if (!p) s += '.'
      else s += p.player === 'white' ? (p.type === 'king' ? 'W' : 'w') : (p.type === 'king' ? 'B' : 'b')
    }
  }
  return s
}

export function createCheckersState(
  difficulty: CheckersDifficulty = 'medium',
  humanPlayer: CheckersPlayer = 'white'
): CheckersState {
  const board = createInitialBoard()
  const allMoves = getAllMoves(board, 'white')
  const initialHash = hashCheckersPosition(board, 'white')

  return {
    board,
    currentPlayer: 'white',
    humanPlayer,
    status: 'in_progress',
    winner: null,
    selectedCell: null,
    validMoves: [],
    allMoves,
    difficulty,
    scores: { black: 0, white: 0 },
    startTime: Date.now(),
    isBotThinking: humanPlayer === 'black',
    pieces: countPieces(board),
    positionHistory: [initialHash],
  }
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE
}

/** Получить ходы для обычной шашки (man) из позиции, включая цепочные прыжки */
function getManMoves(
  board: CheckersBoard,
  row: number,
  col: number,
  player: CheckersPlayer,
  capturesOnly: boolean
): CheckersMove[] {
  const moves: CheckersMove[] = []
  const dir = player === 'black' ? 1 : -1
  const opponent: CheckersPlayer = player === 'black' ? 'white' : 'black'

  if (!capturesOnly) {
    // Обычные ходы вперёд
    for (const dc of [-1, 1]) {
      const nr = row + dir, nc = col + dc
      if (inBounds(nr, nc) && !board[nr][nc]) {
        moves.push({ from: [row, col], to: [nr, nc], captures: [], isKingMove: false })
      }
    }
  }

  // Взятия (вперёд и назад для man в русских шашках — взятие разрешено в любую сторону)
  for (const dr of [-1, 1]) {
    for (const dc of [-1, 1]) {
      const mr = row + dr, mc = col + dc   // позиция вражеской шашки
      const lr = row + 2 * dr, lc = col + 2 * dc  // позиция приземления
      if (
        inBounds(mr, mc) &&
        inBounds(lr, lc) &&
        board[mr][mc]?.player === opponent &&
        !board[lr][lc]
      ) {
        moves.push({ from: [row, col], to: [lr, lc], captures: [[mr, mc]], isKingMove: false })
      }
    }
  }

  return moves
}

/** Проверка: есть ли у дамки с клетки [fromR, fromC] возможность взятия следующей фигуры */
function canKingCaptureFrom(
  board: CheckersBoard,
  fromR: number,
  fromC: number,
  justCaptured: [number, number],
  player: CheckersPlayer
): boolean {
  const opponent: CheckersPlayer = player === 'black' ? 'white' : 'black'
  for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    let r = fromR + dr, c = fromC + dc
    let foundOpponent: [number, number] | null = null

    while (inBounds(r, c)) {
      if (r === justCaptured[0] && c === justCaptured[1]) {
        break
      }
      const cell = board[r][c]
      if (cell?.player === player) break
      if (cell?.player === opponent) {
        if (foundOpponent) break
        foundOpponent = [r, c]
        r += dr; c += dc
        continue
      }
      if (foundOpponent) {
        return true
      }
      r += dr; c += dc
    }
  }
  return false
}

/** Получить ходы для дамки (king) */
function getKingMoves(
  board: CheckersBoard,
  row: number,
  col: number,
  player: CheckersPlayer,
  capturesOnly: boolean
): CheckersMove[] {
  const moves: CheckersMove[] = []
  const opponent: CheckersPlayer = player === 'black' ? 'white' : 'black'

  for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    let r = row + dr, c = col + dc
    let foundOpponent: [number, number] | null = null
    const lineMoves: CheckersMove[] = []

    while (inBounds(r, c)) {
      const cell = board[r][c]

      if (cell?.player === player) break // своя — стоп

      if (cell?.player === opponent) {
        if (foundOpponent) break // вторая вражеская — стоп
        foundOpponent = [r, c]
        r += dr; c += dc
        continue
      }

      // Пустая клетка
      if (foundOpponent) {
        lineMoves.push({
          from: [row, col], to: [r, c],
          captures: [foundOpponent], isKingMove: true,
        })
      } else if (!capturesOnly) {
        moves.push({ from: [row, col], to: [r, c], captures: [], isKingMove: true })
      }

      r += dr; c += dc
    }

    if (lineMoves.length > 0) {
      // Правило русских шашек: если дамка может продолжить бой с некоторого поля,
      // она обязана встать на поле, откуда бой продолжается
      const continuations = lineMoves.filter((m) =>
        canKingCaptureFrom(board, m.to[0], m.to[1], m.captures[0], player)
      )
      if (continuations.length > 0) {
        moves.push(...continuations)
      } else {
        moves.push(...lineMoves)
      }
    }
  }

  return moves
}

/** Все ходы для фигуры на данной клетке */
export function getPieceMoves(
  board: CheckersBoard,
  row: number,
  col: number,
  capturesOnly: boolean
): CheckersMove[] {
  const piece = board[row][col]
  if (!piece) return []

  if (piece.type === 'king') {
    return getKingMoves(board, row, col, piece.player, capturesOnly)
  }
  return getManMoves(board, row, col, piece.player, capturesOnly)
}

/** Все доступные ходы для игрока (с приоритетом взятий) */
export function getAllMoves(board: CheckersBoard, player: CheckersPlayer): CheckersMove[] {
  const captures: CheckersMove[] = []
  const normals: CheckersMove[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c]?.player === player) {
        const caps = getPieceMoves(board, r, c, true).filter(m => m.captures.length > 0)
        captures.push(...caps)
        if (caps.length === 0) {
          normals.push(...getPieceMoves(board, r, c, false).filter(m => m.captures.length === 0))
        }
      }
    }
  }

  // Если есть взятия — только взятия (обязательное правило)
  return captures.length > 0 ? captures : normals
}

/** Применить ход к доске */
function applyMoveToBoard(board: CheckersBoard, move: CheckersMove): CheckersBoard {
  const newBoard = board.map(row => [...row])
  const [fr, fc] = move.from
  const [tr, tc] = move.to

  // Переставляем фигуру
  const piece = newBoard[fr][fc]!
  newBoard[tr][tc] = { ...piece }
  newBoard[fr][fc] = null

  // Удаляем взятые
  for (const [cr, cc] of move.captures) {
    newBoard[cr][cc] = null
  }

  // Превращение в дамку
  if (piece.type === 'man') {
    if (piece.player === 'black' && tr === BOARD_SIZE - 1) {
      newBoard[tr][tc] = { player: 'black', type: 'king' }
    }
    if (piece.player === 'white' && tr === 0) {
      newBoard[tr][tc] = { player: 'white', type: 'king' }
    }
  }

  return newBoard
}

/** Применить ход к состоянию (включая цепочные прыжки) */
export function applyMove(state: CheckersState, move: CheckersMove): CheckersState {
  const newBoard = applyMoveToBoard(state.board, move)
  const pieces = countPieces(newBoard)
  const botPlayer: CheckersPlayer = state.humanPlayer === 'black' ? 'white' : 'black'

  // После взятия — проверяем продолжение цепочного прыжка
  if (move.captures.length > 0) {
    const continuations = getPieceMoves(newBoard, move.to[0], move.to[1], true)
      .filter(m => m.captures.length > 0)

    if (continuations.length > 0) {
      // Текущий игрок продолжает ход
      return {
        ...state,
        board: newBoard,
        selectedCell: move.to,
        validMoves: continuations,
        allMoves: continuations,
        pieces,
        isBotThinking: state.currentPlayer === botPlayer,
      }
    }
  }

  // Передаём ход
  const nextPlayer: CheckersPlayer = state.currentPlayer === 'black' ? 'white' : 'black'
  const nextMoves = getAllMoves(newBoard, nextPlayer)

  // Победа — у противника нет ходов или нет шашек
  let status: CheckersState['status'] = 'in_progress'
  let winner: CheckersPlayer | null = null

  const posHash = hashCheckersPosition(newBoard, nextPlayer)
  const history = [...(state.positionHistory || []), posHash]
  const occurrences = history.filter((h) => h === posHash).length

  if (nextMoves.length === 0 || pieces[nextPlayer] === 0) {
    status = 'won'
    winner = state.currentPlayer
  } else if (pieces.black + pieces.white <= 2 || occurrences >= 3) {
    // Ничья при 3-кратном повторении позиции или минимуме фигур
    status = 'draw'
  }

  const newScores = winner
    ? { ...state.scores, [winner]: state.scores[winner] + 1 }
    : state.scores

  return {
    ...state,
    board: newBoard,
    currentPlayer: nextPlayer,
    status,
    winner,
    selectedCell: null,
    validMoves: [],
    allMoves: nextMoves,
    scores: newScores,
    pieces,
    isBotThinking: status === 'in_progress' && nextPlayer === botPlayer,
    positionHistory: history,
  }
}

/** Выбрать клетку — вычислить валидные ходы */
export function selectCell(state: CheckersState, row: number, col: number): CheckersState {
  if (state.status !== 'in_progress') return state

  const piece = state.board[row][col]
  if (!piece || piece.player !== state.currentPlayer) {
    // Проверяем можем ли сделать ход на эту клетку
    const move = state.validMoves.find(m => m.to[0] === row && m.to[1] === col)
    if (move) return applyMove(state, move)
    return { ...state, selectedCell: null, validMoves: [] }
  }

  // Только ходы из allMoves для этой фигуры
  const moves = state.allMoves.filter(m => m.from[0] === row && m.from[1] === col)

  return {
    ...state,
    selectedCell: [row, col],
    validMoves: moves,
  }
}

// Экспортируем applyMoveToBoard для AI
export { applyMoveToBoard }
