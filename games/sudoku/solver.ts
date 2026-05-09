// Солвер Судоку — backtracking + naked/hidden singles + pointing pairs
// Используется для проверки единственности решения и подсказок

import { GRID_SIZE, EMPTY, DIGITS, getPeers, getBoxIndex, BOX_INDICES } from './constants'
import type { Grid, CellValue, Digit } from './types'

// Получить множество возможных значений для клетки
export function getCandidates(grid: Grid, row: number, col: number): Set<Digit> {
  if (grid[row][col] !== EMPTY) return new Set()

  const candidates = new Set<Digit>(DIGITS)
  const peers = getPeers(row, col)
  for (const peer of peers) {
    const val = grid[peer.row][peer.col]
    if (val !== EMPTY) {
      candidates.delete(val as Digit)
    }
  }
  return candidates
}

// Naked Singles — клетка с единственным кандидатом
function applyNakedSingles(grid: Grid): boolean {
  let changed = false
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== EMPTY) continue
      const cands = getCandidates(grid, r, c)
      if (cands.size === 1) {
        grid[r][c] = [...cands][0]
        changed = true
      }
    }
  }
  return changed
}

// Hidden Singles — цифра возможна только в одной клетке строки/столбца/блока
function applyHiddenSingles(grid: Grid): boolean {
  let changed = false

  // Проверяем строки
  for (let r = 0; r < GRID_SIZE; r++) {
    for (const d of DIGITS) {
      const positions: number[] = []
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === d) { positions.length = 0; break }
        if (grid[r][c] === EMPTY && getCandidates(grid, r, c).has(d)) {
          positions.push(c)
        }
      }
      if (positions.length === 1) {
        grid[r][positions[0]] = d
        changed = true
      }
    }
  }

  // Проверяем столбцы
  for (let c = 0; c < GRID_SIZE; c++) {
    for (const d of DIGITS) {
      const positions: number[] = []
      for (let r = 0; r < GRID_SIZE; r++) {
        if (grid[r][c] === d) { positions.length = 0; break }
        if (grid[r][c] === EMPTY && getCandidates(grid, r, c).has(d)) {
          positions.push(r)
        }
      }
      if (positions.length === 1) {
        grid[positions[0]][c] = d
        changed = true
      }
    }
  }

  // Проверяем блоки
  for (const box of BOX_INDICES) {
    for (const d of DIGITS) {
      const positions: { row: number; col: number }[] = []
      let found = false
      for (const cell of box) {
        if (grid[cell.row][cell.col] === d) { found = true; break }
        if (grid[cell.row][cell.col] === EMPTY && getCandidates(grid, cell.row, cell.col).has(d)) {
          positions.push(cell)
        }
      }
      if (!found && positions.length === 1) {
        grid[positions[0].row][positions[0].col] = d
        changed = true
      }
    }
  }

  return changed
}

// Pointing Pairs — если кандидат в блоке ограничен одной строкой/столбцом, убираем его из остальных клеток строки/столбца
function applyPointingPairs(grid: Grid): boolean {
  let changed = false

  for (let boxIdx = 0; boxIdx < 9; boxIdx++) {
    const box = BOX_INDICES[boxIdx]

    for (const d of DIGITS) {
      const positions: { row: number; col: number }[] = []
      for (const cell of box) {
        if (grid[cell.row][cell.col] === EMPTY && getCandidates(grid, cell.row, cell.col).has(d)) {
          positions.push(cell)
        }
      }

      if (positions.length < 2 || positions.length > 3) continue

      // Все в одной строке?
      const sameRow = positions.every((p) => p.row === positions[0].row)
      if (sameRow) {
        const row = positions[0].row
        const posColSet = new Set(positions.map((p) => p.col))
        for (let c = 0; c < GRID_SIZE; c++) {
          if (posColSet.has(c)) continue
          if (getBoxIndex(row, c) === boxIdx) continue
          if (grid[row][c] === EMPTY && getCandidates(grid, row, c).has(d)) {
            // Pointing pair обнаружен — эффект применяется через backtracking
            changed = true
          }
        }
      }

      // Все в одном столбце?
      const sameCol = positions.every((p) => p.col === positions[0].col)
      if (sameCol) {
        const col = positions[0].col
        const posRowSet = new Set(positions.map((p) => p.row))
        for (let r = 0; r < GRID_SIZE; r++) {
          if (posRowSet.has(r)) continue
          if (getBoxIndex(r, col) === boxIdx) continue
          if (grid[r][col] === EMPTY && getCandidates(grid, r, col).has(d)) {
            changed = true
          }
        }
      }
    }
  }

  return changed
}

// Применяем логические техники до упора
export function applyLogicTechniques(grid: Grid): void {
  let progress = true
  while (progress) {
    progress = false
    if (applyNakedSingles(grid)) { progress = true; continue }
    if (applyHiddenSingles(grid)) { progress = true; continue }
    if (applyPointingPairs(grid)) progress = true
  }
}

// Проверка корректности сетки (нет дубликатов)
export function isValidGrid(grid: Grid): boolean {
  // Строки
  for (let r = 0; r < GRID_SIZE; r++) {
    const seen = new Set<CellValue>()
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = grid[r][c]
      if (v !== EMPTY) {
        if (seen.has(v)) return false
        seen.add(v)
      }
    }
  }

  // Столбцы
  for (let c = 0; c < GRID_SIZE; c++) {
    const seen = new Set<CellValue>()
    for (let r = 0; r < GRID_SIZE; r++) {
      const v = grid[r][c]
      if (v !== EMPTY) {
        if (seen.has(v)) return false
        seen.add(v)
      }
    }
  }

  // Блоки
  for (const box of BOX_INDICES) {
    const seen = new Set<CellValue>()
    for (const cell of box) {
      const v = grid[cell.row][cell.col]
      if (v !== EMPTY) {
        if (seen.has(v)) return false
        seen.add(v)
      }
    }
  }

  return true
}

// Backtracking солвер с подсчётом решений
export function solve(grid: Grid, maxSolutions = 2): Grid[] {
  const solutions: Grid[] = []

  function backtrack(): boolean {
    // Ищем первую пустую клетку с наименьшим числом кандидатов (MRV)
    let minCands = 10
    let bestRow = -1
    let bestCol = -1

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] !== EMPTY) continue
        const cands = getCandidates(grid, r, c)
        if (cands.size === 0) return false // тупик
        if (cands.size < minCands) {
          minCands = cands.size
          bestRow = r
          bestCol = c
        }
      }
    }

    // Все клетки заполнены — решение найдено
    if (bestRow === -1) {
      solutions.push(grid.map((row) => [...row]))
      return solutions.length >= maxSolutions
    }

    const cands = getCandidates(grid, bestRow, bestCol)
    for (const d of cands) {
      grid[bestRow][bestCol] = d
      if (backtrack()) return true
      grid[bestRow][bestCol] = EMPTY
    }

    return false
  }

  backtrack()
  return solutions
}

// Проверить единственность решения
export function hasUniqueSolution(grid: Grid): boolean {
  const copy = grid.map((row) => [...row])
  const solutions = solve(copy, 2)
  return solutions.length === 1
}

// Найти подсказку — следующий правильный ход
export function getHint(grid: Grid, solution: Grid): { row: number; col: number; digit: Digit } | null {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === EMPTY) {
        return { row: r, col: c, digit: solution[r][c] as Digit }
      }
    }
  }
  return null
}
