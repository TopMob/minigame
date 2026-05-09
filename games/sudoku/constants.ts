// Константы для Судоку

export const GRID_SIZE = 9
export const BOX_SIZE = 3
export const EMPTY = 0
export const MAX_ERRORS = 3
export const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

// Индексы строк/столбцов для каждого блока 3x3
export const BOX_INDICES: { row: number; col: number }[][] = []

for (let boxRow = 0; boxRow < 3; boxRow++) {
  for (let boxCol = 0; boxCol < 3; boxCol++) {
    const cells: { row: number; col: number }[] = []
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        cells.push({ row: boxRow * 3 + r, col: boxCol * 3 + c })
      }
    }
    BOX_INDICES.push(cells)
  }
}

// Получить индекс блока по строке и столбцу
export function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3)
}

// Получить все клетки в одной строке
export function getRowPeers(row: number): { row: number; col: number }[] {
  const peers: { row: number; col: number }[] = []
  for (let c = 0; c < GRID_SIZE; c++) {
    peers.push({ row, col: c })
  }
  return peers
}

// Получить все клетки в одном столбце
export function getColPeers(col: number): { row: number; col: number }[] {
  const peers: { row: number; col: number }[] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    peers.push({ row: r, col })
  }
  return peers
}

// Получить все клетки-соседи (строка + столбец + блок, без самой клетки)
export function getPeers(row: number, col: number): { row: number; col: number }[] {
  const set = new Set<string>()
  const peers: { row: number; col: number }[] = []

  // Строка
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col) {
      const key = `${row},${c}`
      if (!set.has(key)) {
        set.add(key)
        peers.push({ row, col: c })
      }
    }
  }

  // Столбец
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row) {
      const key = `${r},${col}`
      if (!set.has(key)) {
        set.add(key)
        peers.push({ row: r, col })
      }
    }
  }

  // Блок
  const boxCells = BOX_INDICES[getBoxIndex(row, col)]
  for (const cell of boxCells) {
    if (cell.row !== row || cell.col !== col) {
      const key = `${cell.row},${cell.col}`
      if (!set.has(key)) {
        set.add(key)
        peers.push(cell)
      }
    }
  }

  return peers
}
