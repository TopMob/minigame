// Генератор пазлов Судоку
// Алгоритм: генерируем полностью решённую сетку → удаляем клетки → проверяем единственность

import { GRID_SIZE, EMPTY, DIGITS } from './constants'
import { hasUniqueSolution } from './solver'
import { mulberry32, shuffle } from '../_lib/prng'
import type { Grid, Digit, Difficulty } from './types'
import { DIFFICULTY_CONFIG } from './types'

// Генерация полной решённой сетки с помощью backtracking + случайного порядка
function generateSolvedGrid(rng: () => number): Grid {
  const grid: Grid = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(EMPTY) as Grid[number]
  )

  function fillCell(pos: number): boolean {
    if (pos === 81) return true

    const row = Math.floor(pos / 9)
    const col = pos % 9

    const digits = shuffle([...DIGITS] as Digit[], rng)
    for (const d of digits) {
      if (isPlacementValid(grid, row, col, d)) {
        grid[row][col] = d
        if (fillCell(pos + 1)) return true
        grid[row][col] = EMPTY
      }
    }
    return false
  }

  fillCell(0)
  return grid
}

// Проверка: можно ли поставить цифру без конфликтов
function isPlacementValid(grid: Grid, row: number, col: number, digit: Digit): boolean {
  // Строка
  for (let c = 0; c < GRID_SIZE; c++) {
    if (grid[row][c] === digit) return false
  }
  // Столбец
  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r][col] === digit) return false
  }
  // Блок 3x3
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c] === digit) return false
    }
  }
  return true
}

// Создание пазла: удаляем клетки из решённой сетки, проверяя единственность
function createPuzzle(solution: Grid, givens: number, rng: () => number): Grid {
  const puzzle: Grid = solution.map((row) => [...row])
  const totalCells = 81
  const toRemove = totalCells - givens

  // Создаём список всех позиций и перемешиваем
  const positions: { row: number; col: number }[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      positions.push({ row: r, col: c })
    }
  }
  const shuffled = shuffle(positions, rng)

  let removed = 0
  for (const pos of shuffled) {
    if (removed >= toRemove) break

    const backup = puzzle[pos.row][pos.col]
    puzzle[pos.row][pos.col] = EMPTY

    // Проверяем единственность решения
    if (hasUniqueSolution(puzzle)) {
      removed++
    } else {
      // Возвращаем обратно — удаление нарушает единственность
      puzzle[pos.row][pos.col] = backup
    }
  }

  return puzzle
}

// Основная функция генерации
export function generateSudoku(
  difficulty: Difficulty,
  seed?: number
): { puzzle: Grid; solution: Grid; seed: number } {
  const actualSeed = seed ?? Date.now()
  const rng = mulberry32(actualSeed)

  const { givens } = DIFFICULTY_CONFIG[difficulty]
  const solution = generateSolvedGrid(rng)
  const puzzle = createPuzzle(solution, givens, rng)

  return { puzzle, solution, seed: actualSeed }
}
