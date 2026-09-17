// Движок игры Сапёр: гарантированно безопасный первый клик, каскадное открытие и хординг

import type { GameEngine } from '../_lib/types'
import type {
  MinesweeperState,
  MinesweeperAction,
  MinesweeperOptions,
  CellState,
  Difficulty,
} from './types'
import { MINESWEEPER_CONFIG } from './types'

function getNeighbors(row: number, col: number, rows: number, cols: number): { r: number; c: number }[] {
  const neighbors: { r: number; c: number }[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr
      const nc = col + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push({ r: nr, c: nc })
      }
    }
  }
  return neighbors
}

function initializeMines(
  grid: CellState[][],
  rows: number,
  cols: number,
  totalMines: number,
  safeRow: number,
  safeCol: number
): void {
  // Список всех возможных координат, исключая безопасную зону 3x3 вокруг первого клика
  const candidates: { r: number; c: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isNearFirstClick = Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1
      if (!isNearFirstClick) {
        candidates.push({ r, c })
      }
    }
  }

  // Перемешивание Фишера-Йетса
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = candidates[i]
    candidates[i] = candidates[j]
    candidates[j] = temp
  }

  // Расставляем мины
  const minesToPlace = Math.min(totalMines, candidates.length)
  for (let i = 0; i < minesToPlace; i++) {
    const { r, c } = candidates[i]
    grid[r][c].isMine = true
  }

  // Подсчитываем соседние мины
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].isMine) continue
      let count = 0
      const neighbors = getNeighbors(r, c, rows, cols)
      for (const n of neighbors) {
        if (grid[n.r][n.c].isMine) count++
      }
      grid[r][c].adjacentMines = count
    }
  }
}

function cloneGrid(grid: CellState[][]): CellState[][] {
  return grid.map((row) => row.map((cell) => ({ ...cell })))
}

export const minesweeperEngine: GameEngine<MinesweeperState, MinesweeperAction, MinesweeperOptions> = {
  createInitialState(opts: MinesweeperOptions = {}): MinesweeperState {
    const difficulty: Difficulty = opts.difficulty ?? 'easy'
    const config = MINESWEEPER_CONFIG[difficulty]
    const rows = opts.rows ?? config.rows
    const cols = opts.cols ?? config.cols
    const totalMines = opts.mines ?? config.mines

    const grid: CellState[][] = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        row: r,
        col: c,
        isMine: false,
        adjacentMines: 0,
        isRevealed: false,
        isFlagged: false,
      }))
    )

    return {
      grid,
      rows,
      cols,
      totalMines,
      minesRemaining: totalMines,
      status: 'idle',
      timeElapsed: 0,
      firstClickDone: false,
      difficulty,
      cellsRevealed: 0,
      totalSafeCells: rows * cols - totalMines,
    }
  },

  applyAction(state: MinesweeperState, action: MinesweeperAction): MinesweeperState {
    if (action.type === 'restart') {
      return minesweeperEngine.createInitialState({ difficulty: state.difficulty })
    }

    if (action.type === 'setDifficulty') {
      return minesweeperEngine.createInitialState({ difficulty: action.difficulty })
    }

    if (state.status === 'won' || state.status === 'lost') {
      return state
    }

    const newGrid = cloneGrid(state.grid)
    const { rows, cols } = state

    if (action.type === 'toggleFlag') {
      const { row, col } = action
      const cell = newGrid[row][col]
      if (cell.isRevealed) return state

      const nextFlagged = !cell.isFlagged
      cell.isFlagged = nextFlagged

      const flagCount = newGrid.reduce(
        (acc, r) => acc + r.filter((c) => c.isFlagged).length,
        0
      )

      return {
        ...state,
        grid: newGrid,
        status: state.status === 'idle' ? 'playing' : state.status,
        minesRemaining: state.totalMines - flagCount,
      }
    }

    if (action.type === 'reveal') {
      const { row, col } = action
      const target = newGrid[row][col]

      if (target.isRevealed || target.isFlagged) {
        return state
      }

      // Если это самый первый клик в игре: инициализируем мины с гарантией зоны 3x3
      if (!state.firstClickDone) {
        initializeMines(newGrid, rows, cols, state.totalMines, row, col)
      }

      // Если кликнули по мине: поражение
      if (target.isMine) {
        target.isRevealed = true
        target.isExploded = true

        // Раскрываем все остальные мины и отмечаем неверные флаги
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cell = newGrid[r][c]
            if (cell.isMine) {
              cell.isRevealed = true
            } else if (cell.isFlagged && !cell.isMine) {
              cell.isWrongFlag = true
            }
          }
        }

        return {
          ...state,
          grid: newGrid,
          status: 'lost',
          firstClickDone: true,
        }
      }

      // Каскадное открытие пустых клеток с помощью BFS
      const queue: { r: number; c: number }[] = [{ r: row, c: col }]
      target.isRevealed = true
      let newlyRevealed = 1

      while (queue.length > 0) {
        const curr = queue.shift()!
        const currCell = newGrid[curr.r][curr.c]

        if (currCell.adjacentMines === 0) {
          const neighbors = getNeighbors(curr.r, curr.c, rows, cols)
          for (const n of neighbors) {
            const nCell = newGrid[n.r][n.c]
            if (!nCell.isRevealed && !nCell.isFlagged && !nCell.isMine) {
              nCell.isRevealed = true
              newlyRevealed++
              if (nCell.adjacentMines === 0) {
                queue.push({ r: n.r, c: n.c })
              }
            }
          }
        }
      }

      const totalRevealed = state.cellsRevealed + newlyRevealed
      const isWon = totalRevealed >= state.totalSafeCells

      if (isWon) {
        // При победе автоматически ставим флаги на все мины
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (newGrid[r][c].isMine) {
              newGrid[r][c].isFlagged = true
            }
          }
        }
      }

      return {
        ...state,
        grid: newGrid,
        status: isWon ? 'won' : 'playing',
        firstClickDone: true,
        cellsRevealed: totalRevealed,
        minesRemaining: isWon ? 0 : state.minesRemaining,
      }
    }

    if (action.type === 'chord') {
      const { row, col } = action
      const cell = newGrid[row][col]

      if (!cell.isRevealed || cell.adjacentMines === 0) {
        return state
      }

      const neighbors = getNeighbors(row, col, rows, cols)
      const flaggedCount = neighbors.filter((n) => newGrid[n.r][n.c].isFlagged).length

      // Хординг разрешен только если число флагов вокруг равно числу мины в ячейке
      if (flaggedCount !== cell.adjacentMines) {
        return state
      }

      let hitMine = false
      let newlyRevealed = 0
      const emptyQueue: { r: number; c: number }[] = []

      for (const n of neighbors) {
        const nCell = newGrid[n.r][n.c]
        if (!nCell.isRevealed && !nCell.isFlagged) {
          nCell.isRevealed = true
          newlyRevealed++

          if (nCell.isMine) {
            nCell.isExploded = true
            hitMine = true
          } else if (nCell.adjacentMines === 0) {
            emptyQueue.push({ r: n.r, c: n.c })
          }
        }
      }

      if (hitMine) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cCell = newGrid[r][c]
            if (cCell.isMine) {
              cCell.isRevealed = true
            } else if (cCell.isFlagged && !cCell.isMine) {
              cCell.isWrongFlag = true
            }
          }
        }
        return {
          ...state,
          grid: newGrid,
          status: 'lost',
        }
      }

      // Каскадное открытие пустых ячеек, задетых хордингом
      while (emptyQueue.length > 0) {
        const curr = emptyQueue.shift()!
        const currNeighbors = getNeighbors(curr.r, curr.c, rows, cols)
        for (const n of currNeighbors) {
          const nCell = newGrid[n.r][n.c]
          if (!nCell.isRevealed && !nCell.isFlagged && !nCell.isMine) {
            nCell.isRevealed = true
            newlyRevealed++
            if (nCell.adjacentMines === 0) {
              emptyQueue.push({ r: n.r, c: n.c })
            }
          }
        }
      }

      const totalRevealed = state.cellsRevealed + newlyRevealed
      const isWon = totalRevealed >= state.totalSafeCells

      if (isWon) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (newGrid[r][c].isMine) {
              newGrid[r][c].isFlagged = true
            }
          }
        }
      }

      return {
        ...state,
        grid: newGrid,
        status: isWon ? 'won' : 'playing',
        cellsRevealed: totalRevealed,
        minesRemaining: isWon ? 0 : state.minesRemaining,
      }
    }

    return state
  },

  isValidAction(state: MinesweeperState, action: MinesweeperAction): boolean {
    if (action.type === 'restart' || action.type === 'setDifficulty') return true
    if (state.status === 'won' || state.status === 'lost') return false

    const { row, col } = action
    if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) return false

    return true
  },

  isGameOver(state: MinesweeperState): boolean {
    return state.status === 'won' || state.status === 'lost'
  },

  getScore(state: MinesweeperState): number {
    if (state.status !== 'won') return 0
    const multiplier = { easy: 1, medium: 3, hard: 6 }[state.difficulty]
    const base = 1000 * multiplier
    const timeBonus = Math.max(0, 999 - state.timeElapsed) * multiplier
    return base + timeBonus
  },

  hashState(state: MinesweeperState): string {
    return `${state.status}:${state.cellsRevealed}:${state.minesRemaining}`
  },
}