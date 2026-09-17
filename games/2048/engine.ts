// Движок игры 2048: классическая механика слияния плиток

import type { GameEngine } from '../_lib/types'
import type { Game2048State, Game2048Action, Game2048Options, Tile } from './types'

const DEFAULT_SIZE = 4
let nextTileId = 1

function createTile(row: number, col: number, value: number, isNew = false): Tile {
  return {
    id: `tile_${nextTileId++}_${Date.now()}`,
    value,
    row,
    col,
    isNew,
  }
}

function getEmptyCells(size: number, tiles: Tile[]): { row: number; col: number }[] {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`))
  const empty: { row: number; col: number }[] = []

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!occupied.has(`${r},${c}`)) {
        empty.push({ row: r, col: c })
      }
    }
  }

  return empty
}

function spawnRandomTile(size: number, tiles: Tile[], rng: () => number = Math.random): Tile | null {
  const empty = getEmptyCells(size, tiles)
  if (empty.length === 0) return null

  const index = Math.floor(rng() * empty.length)
  const cell = empty[index]
  const value = rng() < 0.9 ? 2 : 4

  return createTile(cell.row, cell.col, value, true)
}

function hasMovesAvailable(size: number, tiles: Tile[]): boolean {
  if (tiles.length < size * size) return true

  const grid: (number | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
  for (const t of tiles) {
    grid[t.row][t.col] = t.value
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r][c]
      if (val === null) return true

      if (r + 1 < size && grid[r + 1][c] === val) return true
      if (c + 1 < size && grid[r][c + 1] === val) return true
    }
  }

  return false
}

export const game2048Engine: GameEngine<Game2048State, Game2048Action, Game2048Options> = {
  createInitialState(opts: Game2048Options = {}): Game2048State {
    const size = opts.size ?? DEFAULT_SIZE
    const tiles: Tile[] = []

    const first = spawnRandomTile(size, tiles)
    if (first) tiles.push(first)
    const second = spawnRandomTile(size, tiles)
    if (second) tiles.push(second)

    return {
      tiles,
      score: 0,
      bestScore: 0,
      moves: 0,
      isWon: false,
      isOver: false,
      keepPlaying: false,
      size,
    }
  },

  applyAction(state: Game2048State, action: Game2048Action): Game2048State {
    if (action.type === 'restart') {
      const initial = game2048Engine.createInitialState({ size: state.size })
      return {
        ...initial,
        bestScore: state.bestScore,
      }
    }

    if (action.type === 'keepPlaying') {
      return {
        ...state,
        isWon: false,
        keepPlaying: true,
      }
    }

    if (action.type !== 'move' || state.isOver) {
      return state
    }

    const { direction } = action
    const size = state.size

    const vector = {
      up: { r: -1, c: 0 },
      down: { r: 1, c: 0 },
      left: { r: 0, c: -1 },
      right: { r: 0, c: 1 },
    }[direction]

    const rows = Array.from({ length: size }, (_, i) => i)
    const cols = Array.from({ length: size }, (_, i) => i)

    if (direction === 'down') rows.reverse()
    if (direction === 'right') cols.reverse()

    const grid: (Tile | null)[][] = Array.from({ length: size }, () => Array(size).fill(null))
    for (const t of state.tiles) {
      grid[t.row][t.col] = { ...t, isNew: false, isMerged: false }
    }

    let moved = false
    let addedScore = 0
    let reached2048 = false
    const mergedPositions = new Set<string>()

    for (const r of rows) {
      for (const c of cols) {
        const tile = grid[r][c]
        if (!tile) continue

        let currR = r
        let currC = c
        let merged = false

        while (true) {
          const nextR = currR + vector.r
          const nextC = currC + vector.c

          if (nextR < 0 || nextR >= size || nextC < 0 || nextC >= size) {
            break
          }

          if (grid[nextR][nextC] === null) {
            currR = nextR
            currC = nextC
          } else {
            const targetTile = grid[nextR][nextC]!
            const targetKey = `${nextR},${nextC}`

            if (targetTile.value === tile.value && !mergedPositions.has(targetKey)) {
              grid[r][c] = null
              const mergedVal = tile.value * 2
              const mergedTile = createTile(nextR, nextC, mergedVal, false)
              mergedTile.isMerged = true

              grid[nextR][nextC] = mergedTile
              mergedPositions.add(targetKey)
              addedScore += mergedVal

              if (mergedVal === 2048) {
                reached2048 = true
              }

              moved = true
              merged = true
            }
            break
          }
        }

        if (!merged && (currR !== r || currC !== c)) {
          grid[currR][currC] = { ...tile, row: currR, col: currC }
          grid[r][c] = null
          moved = true
        }
      }
    }

    if (!moved) {
      return state
    }

    const resultTiles: Tile[] = []
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== null) {
          resultTiles.push(grid[r][c]!)
        }
      }
    }

    const newTile = spawnRandomTile(size, resultTiles)
    if (newTile) {
      resultTiles.push(newTile)
    }

    const newScore = state.score + addedScore
    const newBestScore = Math.max(state.bestScore, newScore)
    const isWon = !state.keepPlaying && (state.isWon || reached2048)
    const isOver = !hasMovesAvailable(size, resultTiles)

    return {
      ...state,
      tiles: resultTiles,
      score: newScore,
      bestScore: newBestScore,
      moves: state.moves + 1,
      isWon,
      isOver,
    }
  },

  isValidAction(state: Game2048State, action: Game2048Action): boolean {
    if (action.type === 'restart') return true
    if (action.type === 'keepPlaying') return state.isWon && !state.keepPlaying
    if (action.type === 'move') return !state.isOver
    return false
  },

  isGameOver(state: Game2048State): boolean {
    return state.isOver
  },

  getScore(state: Game2048State): number {
    return state.score
  },

  hashState(state: Game2048State): string {
    const tileStr = state.tiles
      .map((t) => `${t.row},${t.col}:${t.value}`)
      .sort()
      .join('|')
    return `${tileStr}:${state.score}:${state.moves}`
  },
}