import { isValidCoordinate } from './engine'
import {
  BOARD_SIZE,
  type BattleshipDifficulty,
  type CellData,
  type PlacedShip,
  type ShipType,
} from './types'

// Соседние смещения по сторонам света (Север, Восток, Юг, Запад)
const CARDINAL_DIRS: [number, number][] = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
]

// Получить список всех клеток, по которым ещё не стреляли
function getUnshotCells(board: CellData[][]): [number, number][] {
  const cells: [number, number][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const state = board[r][c].state
      if (state === 'empty' || state === 'ship') {
        cells.push([r, c])
      }
    }
  }
  return cells
}

// Найти все подбитые, но ещё не потопленные клетки на поле игрока
function getUnfinishedHits(board: CellData[][]): [number, number][] {
  const hits: [number, number][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c].state === 'hit') {
        hits.push([r, c])
      }
    }
  }
  return hits
}

// Проверка, свободна ли клетка для выстрела
function isCellShootable(board: CellData[][], r: number, c: number): boolean {
  if (!isValidCoordinate(r, c)) return false
  const state = board[r][c].state
  return state === 'empty' || state === 'ship'
}

// Вычисление тепловой карты вероятностей (Probability Density Map) для уровня Hard
function computeProbabilityHeatmap(
  board: CellData[][],
  unsunkSizes: ShipType[]
): number[][] {
  const heatmap: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  )

  for (const size of unsunkSizes) {
    // 1. Проверяем горизонтальные размещения
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c <= BOARD_SIZE - size; c++) {
        let canFit = true
        for (let i = 0; i < size; i++) {
          const state = board[r][c + i].state
          if (state !== 'empty' && state !== 'ship') {
            canFit = false
            break
          }
        }
        if (canFit) {
          for (let i = 0; i < size; i++) {
            heatmap[r][c + i] += 1
          }
        }
      }
    }

    // 2. Проверяем вертикальные размещения
    for (let r = 0; r <= BOARD_SIZE - size; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let canFit = true
        for (let i = 0; i < size; i++) {
          const state = board[r + i][c].state
          if (state !== 'empty' && state !== 'ship') {
            canFit = false
            break
          }
        }
        if (canFit) {
          for (let i = 0; i < size; i++) {
            heatmap[r + i][c] += 1
          }
        }
      }
    }
  }

  return heatmap
}

// Логика добивания подбитого корабля
function getTargetModeShot(
  board: CellData[][],
  hits: [number, number][]
): [number, number] | null {
  if (hits.length === 0) return null

  // Случай А: Подбита ровно 1 палуба — зондируем 4 направления вокруг
  if (hits.length === 1) {
    const [hr, hc] = hits[0]
    const candidates: [number, number][] = []

    for (const [dr, dc] of CARDINAL_DIRS) {
      const nr = hr + dr
      const nc = hc + dc
      if (isCellShootable(board, nr, nc)) {
        candidates.push([nr, nc])
      }
    }

    if (candidates.length > 0) {
      // Выбираем случайного соседа из доступных
      return candidates[Math.floor(Math.random() * candidates.length)]
    }
  }

  // Случай Б: Подбито 2 или более палуб одного корабля — направление уже известно!
  const isHorizontal = hits.every(([r]) => r === hits[0][0])
  const isVertical = hits.every(([, c]) => c === hits[0][1])

  if (isHorizontal) {
    const r = hits[0][0]
    const cols = hits.map(([, c]) => c).sort((a, b) => a - b)
    const minCol = cols[0]
    const maxCol = cols[cols.length - 1]

    const candidates: [number, number][] = []
    if (isCellShootable(board, r, minCol - 1)) candidates.push([r, minCol - 1])
    if (isCellShootable(board, r, maxCol + 1)) candidates.push([r, maxCol + 1])

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)]
    }
  }

  if (isVertical) {
    const c = hits[0][1]
    const rows = hits.map(([r]) => r).sort((a, b) => a - b)
    const minRow = rows[0]
    const maxRow = rows[rows.length - 1]

    const candidates: [number, number][] = []
    if (isCellShootable(board, minRow - 1, c)) candidates.push([minRow - 1, c])
    if (isCellShootable(board, maxRow + 1, c)) candidates.push([maxRow + 1, c])

    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)]
    }
  }

  // Если попались два разных корабля рядом, берем любого незакрытого соседа любой подбитой клетки
  for (const [hr, hc] of hits) {
    for (const [dr, dc] of CARDINAL_DIRS) {
      const nr = hr + dr
      const nc = hc + dc
      if (isCellShootable(board, nr, nc)) {
        return [nr, nc]
      }
    }
  }

  return null
}

// Главная функция выбора хода ботом
export function getBotBattleshipShot(
  playerBoard: CellData[][],
  playerFleet: PlacedShip[],
  difficulty: BattleshipDifficulty
): [number, number] {
  const unshot = getUnshotCells(playerBoard)
  if (unshot.length === 0) return [0, 0]

  // Проверяем, есть ли раненые недобитые корабли (Режим добивания)
  const unfinishedHits = getUnfinishedHits(playerBoard)

  if (unfinishedHits.length > 0) {
    const targetShot = getTargetModeShot(playerBoard, unfinishedHits)
    if (targetShot) {
      return targetShot
    }
  }

  // --- РЕЖИМ ПОИСКА (HUNT MODE) ---

  // 1. УРОВЕНЬ: EASY
  // Чисто случайные выстрелы
  if (difficulty === 'easy') {
    return unshot[Math.floor(Math.random() * unshot.length)]
  }

  // 2. УРОВЕНЬ: MEDIUM
  // Стрельба по шахматному шаблону (четные клетки)
  if (difficulty === 'medium') {
    const checkerboardCells = unshot.filter(([r, c]) => (r + c) % 2 === 0)
    if (checkerboardCells.length > 0) {
      return checkerboardCells[Math.floor(Math.random() * checkerboardCells.length)]
    }
    return unshot[Math.floor(Math.random() * unshot.length)]
  }

  // 3. УРОВЕНЬ: HARD
  // Вероятностная тепловая карта по оставшимся непотопленным кораблям игрока
  const unsunkSizes = playerFleet
    .filter((ship) => !ship.isSunk)
    .map((ship) => ship.size)

  const heatmap = computeProbabilityHeatmap(playerBoard, unsunkSizes)

  // Ищем клетку с наивысшей вероятностью среди доступных для выстрела
  let maxScore = -1
  let bestCells: [number, number][] = []

  for (const [r, c] of unshot) {
    const score = heatmap[r][c]
    if (score > maxScore) {
      maxScore = score
      bestCells = [[r, c]]
    } else if (score === maxScore) {
      bestCells.push([r, c])
    }
  }

  if (bestCells.length > 0) {
    // Среди лучших клеток отдаем предпочтение шахматному паттерну для лучшего покрытия
    const parityBest = bestCells.filter(([r, c]) => (r + c) % 2 === 0)
    if (parityBest.length > 0) {
      return parityBest[Math.floor(Math.random() * parityBest.length)]
    }
    return bestCells[Math.floor(Math.random() * bestCells.length)]
  }

  return unshot[Math.floor(Math.random() * unshot.length)]
}
