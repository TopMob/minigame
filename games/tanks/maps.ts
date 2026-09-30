// Карты и уровни для игры Танчики (26x26 тайлов)
import { TileType, GRID_SIZE } from './types'

// Базовые координаты штаба (Орел 2х2 внизу карты)
export const BASE_TILES = [
  { x: 12, y: 24 },
  { x: 13, y: 24 },
  { x: 12, y: 25 },
  { x: 13, y: 25 },
]

// Координаты защитного бункера вокруг штаба (П-образная стена)
export const BUNKER_TILES = [
  { x: 11, y: 23 },
  { x: 12, y: 23 },
  { x: 13, y: 23 },
  { x: 14, y: 23 },
  { x: 11, y: 24 },
  { x: 11, y: 25 },
  { x: 14, y: 24 },
  { x: 14, y: 25 },
]

// Точки спавна танков (в тайловых координатах)
export const ENEMY_SPAWN_TILES = [
  { x: 1, y: 0 },
  { x: 12, y: 0 },
  { x: 23, y: 0 },
]

export const PLAYER_SPAWN_TILE = { x: 8, y: 24 }

// Создание пустой сетки 26х26
function createEmptyGrid(): number[][] {
  const grid: number[][] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: number[] = new Array(GRID_SIZE).fill(TileType.EMPTY)
    grid.push(row)
  }
  return grid
}

// Установка штаба и начального кирпичного бункера
function installBaseAndBunker(grid: number[][]) {
  for (const t of BASE_TILES) {
    grid[t.y][t.x] = TileType.BASE
  }
  for (const t of BUNKER_TILES) {
    grid[t.y][t.x] = TileType.BRICK
  }
}

// Заполнение прямоугольной области на сетке
function fillRect(
  grid: number[][],
  x: number,
  y: number,
  w: number,
  h: number,
  tile: number
) {
  for (let r = y; r < y + h && r < GRID_SIZE; r++) {
    for (let c = x; c < x + w && c < GRID_SIZE; c++) {
      grid[r][c] = tile
    }
  }
}

// Уровень 1: Классическая арена с рекой, кирпичными коридорами и кустами
function buildStage1(grid: number[][]) {
  const B = TileType.BRICK
  const S = TileType.STEEL
  const W = TileType.WATER
  const F = TileType.FOREST

  // Вертикальные колонны кирпичей
  fillRect(grid, 2, 3, 2, 7, B)
  fillRect(grid, 6, 3, 2, 7, B)
  fillRect(grid, 10, 3, 2, 4, B)
  fillRect(grid, 14, 3, 2, 4, B)
  fillRect(grid, 18, 3, 2, 7, B)
  fillRect(grid, 22, 3, 2, 7, B)

  // Центральный стальной блок вверху
  fillRect(grid, 12, 5, 2, 2, S)

  // Река в центре (W) с тремя мостами-проходами
  fillRect(grid, 0, 12, 9, 2, W)
  fillRect(grid, 11, 12, 4, 2, W)
  fillRect(grid, 17, 12, 9, 2, W)

  // Кусты вокруг реки и по флангам
  fillRect(grid, 0, 10, 2, 2, F)
  fillRect(grid, 24, 10, 2, 2, F)
  fillRect(grid, 9, 11, 2, 4, F)
  fillRect(grid, 15, 11, 2, 4, F)

  // Нижняя половина карты
  fillRect(grid, 2, 16, 2, 6, B)
  fillRect(grid, 6, 16, 2, 6, B)
  fillRect(grid, 18, 16, 2, 6, B)
  fillRect(grid, 22, 16, 2, 6, B)

  // Оборонительные редуты
  fillRect(grid, 10, 18, 2, 3, B)
  fillRect(grid, 14, 18, 2, 3, B)
  fillRect(grid, 0, 18, 2, 2, S)
  fillRect(grid, 24, 18, 2, 2, S)
}

// Уровень 2: Укрепленная крепость со стальными бастионами и каналами
function buildStage2(grid: number[][]) {
  const B = TileType.BRICK
  const S = TileType.STEEL
  const W = TileType.WATER
  const F = TileType.FOREST

  // Стальные башни сверху
  fillRect(grid, 4, 2, 2, 2, S)
  fillRect(grid, 20, 2, 2, 2, S)

  // Сложные кирпичные лабиринты
  fillRect(grid, 2, 6, 4, 2, B)
  fillRect(grid, 20, 6, 4, 2, B)
  fillRect(grid, 8, 4, 2, 6, B)
  fillRect(grid, 16, 4, 2, 6, B)
  fillRect(grid, 11, 6, 4, 2, S)

  // Водные рвы слева и справа
  fillRect(grid, 1, 10, 2, 6, W)
  fillRect(grid, 23, 10, 2, 6, W)

  // Центр: крестообразный кирпичный редут с кустами
  fillRect(grid, 12, 10, 2, 5, B)
  fillRect(grid, 8, 12, 10, 2, B)
  fillRect(grid, 6, 11, 2, 4, F)
  fillRect(grid, 18, 11, 2, 4, F)

  // Нижние укрепления
  fillRect(grid, 4, 18, 2, 4, B)
  fillRect(grid, 8, 18, 2, 4, S)
  fillRect(grid, 16, 18, 2, 4, S)
  fillRect(grid, 20, 18, 2, 4, B)

  fillRect(grid, 0, 21, 3, 2, B)
  fillRect(grid, 23, 21, 3, 2, B)
}

// Уровень 3: Зимняя цитадель со скользким льдом и узкими прострелами
function buildStage3(grid: number[][]) {
  const B = TileType.BRICK
  const S = TileType.STEEL
  const W = TileType.WATER
  const F = TileType.FOREST
  const I = TileType.ICE

  // Ледяные скоростные трассы (I)
  fillRect(grid, 3, 0, 2, 11, I)
  fillRect(grid, 21, 0, 2, 11, I)
  fillRect(grid, 5, 12, 16, 2, I)

  // Стальные пулеметные гнезда
  fillRect(grid, 6, 4, 2, 3, S)
  fillRect(grid, 18, 4, 2, 3, S)
  fillRect(grid, 11, 2, 4, 2, B)

  // Водные озера
  fillRect(grid, 8, 8, 4, 3, W)
  fillRect(grid, 14, 8, 4, 3, W)

  // Густой лес
  fillRect(grid, 0, 8, 3, 4, F)
  fillRect(grid, 23, 8, 3, 4, F)
  fillRect(grid, 11, 15, 4, 4, F)

  // Нижняя линия обороны
  fillRect(grid, 2, 17, 4, 2, B)
  fillRect(grid, 20, 17, 4, 2, B)
  fillRect(grid, 6, 20, 2, 4, B)
  fillRect(grid, 18, 20, 2, 4, B)
  fillRect(grid, 9, 21, 2, 2, S)
  fillRect(grid, 15, 21, 2, 2, S)
}

// Генерация сетки для указанного этапа (циклично 1..3 с возрастанием сложности)
export function generateStageGrid(stage: number): number[][] {
  const grid = createEmptyGrid()
  const mapIndex = ((stage - 1) % 3) + 1

  if (mapIndex === 1) {
    buildStage1(grid)
  } else if (mapIndex === 2) {
    buildStage2(grid)
  } else {
    buildStage3(grid)
  }

  // Очищаем зоны спавна, чтобы танки не застревали при рождении
  for (const s of ENEMY_SPAWN_TILES) {
    fillRect(grid, Math.max(0, s.x - 1), s.y, 4, 3, TileType.EMPTY)
  }
  fillRect(grid, PLAYER_SPAWN_TILE.x - 1, PLAYER_SPAWN_TILE.y - 1, 4, 3, TileType.EMPTY)

  // Устанавливаем штаб и бункер
  installBaseAndBunker(grid)

  return grid
}

// Изменение защитных стен бункера штаба (для бонуса «Лопата»)
export function updateBaseWalls(grid: number[][], useSteel: boolean) {
  const targetTile = useSteel ? TileType.STEEL : TileType.BRICK
  for (const t of BUNKER_TILES) {
    // Не затираем если штаб уже разрушен
    if (grid[t.y][t.x] !== TileType.BASE_DESTROYED) {
      grid[t.y][t.x] = targetTile
    }
  }
}
