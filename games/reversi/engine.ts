// Чистый движок правил игры Реверси (Отелло)
import {
  BOARD_SIZE,
  type ReversiBoard,
  type ReversiDifficulty,
  type ReversiHistoryEntry,
  type ReversiMode,
  type ReversiMove,
  type ReversiPlayer,
  type ReversiState,
} from './types'

const DIRECTIONS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
]

export function createInitialBoard(): ReversiBoard {
  const board: ReversiBoard = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(null)
  )
  // Стандартная начальная расстановка Отелло:
  // d4 (3,3)=white, e4 (3,4)=black, d5 (4,3)=black, e5 (4,4)=white
  board[3][3] = 'white'
  board[3][4] = 'black'
  board[4][3] = 'black'
  board[4][4] = 'white'
  return board
}

export function cloneBoard(board: ReversiBoard): ReversiBoard {
  return board.map((row) => [...row])
}

export function getOpponent(player: ReversiPlayer): ReversiPlayer {
  return player === 'black' ? 'white' : 'black'
}

export function isValidCoord(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE
}

// Возвращает список всех клеток соперника, которые будут перевернуты при ходе в (r, c)
export function getFlipsForMove(
  board: ReversiBoard,
  r: number,
  c: number,
  player: ReversiPlayer
): [number, number][] {
  if (!isValidCoord(r, c) || board[r][c] !== null) {
    return []
  }

  const opponent = getOpponent(player)
  const allFlips: [number, number][] = []

  for (const [dr, dc] of DIRECTIONS) {
    const flipsInDir: [number, number][] = []
    let nr = r + dr
    let nc = c + dc

    while (isValidCoord(nr, nc) && board[nr][nc] === opponent) {
      flipsInDir.push([nr, nc])
      nr += dr
      nc += dc
    }

    if (flipsInDir.length > 0 && isValidCoord(nr, nc) && board[nr][nc] === player) {
      allFlips.push(...flipsInDir)
    }
  }

  return allFlips
}

// Получить все допустимые ходы для игрока
export function getValidMoves(board: ReversiBoard, player: ReversiPlayer): ReversiMove[] {
  const validMoves: ReversiMove[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) {
        const flips = getFlipsForMove(board, r, c, player)
        if (flips.length > 0) {
          validMoves.push({ row: r, col: c, flips })
        }
      }
    }
  }

  return validMoves
}

export function countPieces(board: ReversiBoard): Record<ReversiPlayer, number> {
  let black = 0
  let white = 0
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') black++
      else if (board[r][c] === 'white') white++
    }
  }
  return { black, white }
}

export function createInitialState(
  mode: ReversiMode = 'vs-bot',
  difficulty: ReversiDifficulty = 'medium',
  humanPlayer: ReversiPlayer = 'black'
): ReversiState {
  const board = createInitialBoard()
  const pieces = countPieces(board)
  const validMoves = getValidMoves(board, 'black') // Черные ходят первыми

  return {
    board,
    currentPlayer: 'black',
    humanPlayer,
    status: 'in_progress',
    winner: null,
    pieces,
    validMoves,
    lastMove: null,
    recentFlips: [],
    difficulty,
    mode,
    scores: { black: 0, white: 0 },
    startTime: Date.now(),
    isBotThinking: false,
    passMessage: null,
    history: [],
  }
}

// Применение хода
export function applyMove(state: ReversiState, row: number, col: number): ReversiState {
  if (state.status !== 'in_progress') return state

  const move = state.validMoves.find((m) => m.row === row && m.col === col)
  if (!move) return state

  // Сохраняем состояние для отмены хода
  const historyEntry: ReversiHistoryEntry = {
    board: cloneBoard(state.board),
    currentPlayer: state.currentPlayer,
    pieces: { ...state.pieces },
    lastMove: state.lastMove ? { ...state.lastMove } : null,
  }

  const nextBoard = cloneBoard(state.board)
  nextBoard[row][col] = state.currentPlayer

  for (const [fr, fc] of move.flips) {
    nextBoard[fr][fc] = state.currentPlayer
  }

  const nextPieces = countPieces(nextBoard)
  const nextPlayer = getOpponent(state.currentPlayer)

  // Проверяем доступные ходы соперника
  const nextPlayerMoves = getValidMoves(nextBoard, nextPlayer)

  if (nextPlayerMoves.length > 0) {
    // Соперник может ходить
    return {
      ...state,
      board: nextBoard,
      currentPlayer: nextPlayer,
      pieces: nextPieces,
      validMoves: nextPlayerMoves,
      lastMove: { row, col },
      recentFlips: move.flips,
      passMessage: null,
      history: [...state.history, historyEntry],
    }
  }

  // У соперника нет ходов. Проверяем, может ли текущий игрок ходить снова
  const currentPlayerAgainMoves = getValidMoves(nextBoard, state.currentPlayer)

  if (currentPlayerAgainMoves.length > 0) {
    // Пропуск хода соперником!
    const opponentName = nextPlayer === 'black' ? 'Чёрных' : 'Белых'
    return {
      ...state,
      board: nextBoard,
      currentPlayer: state.currentPlayer, // ход остаётся у того же игрока
      pieces: nextPieces,
      validMoves: currentPlayerAgainMoves,
      lastMove: { row, col },
      recentFlips: move.flips,
      passMessage: `У ${opponentName} нет доступных ходов — ход переходит дальше!`,
      history: [...state.history, historyEntry],
    }
  }

  // Ни у кого нет ходов -> Партия завершена!
  let winner: ReversiPlayer | null = null
  let status: 'won' | 'draw' = 'draw'

  if (nextPieces.black > nextPieces.white) {
    winner = 'black'
    status = 'won'
  } else if (nextPieces.white > nextPieces.black) {
    winner = 'white'
    status = 'won'
  }

  const newScores = { ...state.scores }
  if (winner) {
    newScores[winner] += 1
  }

  return {
    ...state,
    board: nextBoard,
    pieces: nextPieces,
    validMoves: [],
    lastMove: { row, col },
    recentFlips: move.flips,
    status,
    winner,
    scores: newScores,
    passMessage: null,
    history: [...state.history, historyEntry],
  }
}

// Отмена хода
export function undoMove(state: ReversiState): ReversiState {
  if (state.history.length === 0 || state.isBotThinking) return state

  // В режиме против бота откатываем до предыдущего хода человека
  let targetIndex = state.history.length - 1
  if (state.mode === 'vs-bot') {
    // Если последний ход был сделан ботом, откатываем 2 шага (ход человека и ход бота)
    if (state.history.length >= 2) {
      targetIndex = state.history.length - 2
    } else {
      targetIndex = 0
    }
  }

  const prevSnapshot = state.history[targetIndex]
  const validMoves = getValidMoves(prevSnapshot.board, prevSnapshot.currentPlayer)

  return {
    ...state,
    board: prevSnapshot.board,
    currentPlayer: prevSnapshot.currentPlayer,
    pieces: prevSnapshot.pieces,
    validMoves,
    lastMove: prevSnapshot.lastMove,
    recentFlips: [],
    status: 'in_progress',
    winner: null,
    passMessage: null,
    history: state.history.slice(0, targetIndex),
  }
}

// Перезапуск игры
export function resetGame(state: ReversiState): ReversiState {
  const board = createInitialBoard()
  const pieces = countPieces(board)
  const validMoves = getValidMoves(board, 'black')

  return {
    ...state,
    board,
    currentPlayer: 'black',
    status: 'in_progress',
    winner: null,
    pieces,
    validMoves,
    lastMove: null,
    recentFlips: [],
    startTime: Date.now(),
    isBotThinking: false,
    passMessage: null,
    history: [],
  }
}
