// Логика и правила игры Морской бой
import {
  BOARD_SIZE,
  FLEET_CONFIG,
  type BattleshipDifficulty,
  type BattleshipState,
  type CellData,
  type PlacedShip,
  type ShipOrientation,
  type ShipType,
  type ShotResult,
} from './types'

export function isValidCoordinate(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE
}

export function createEmptyBoard(): CellData[][] {
  return Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => ({
      row,
      col,
      state: 'empty',
      shipId: null,
    }))
  )
}

export function getShipCoordinates(
  row: number,
  col: number,
  size: ShipType,
  orientation: ShipOrientation
): [number, number][] {
  const coords: [number, number][] = []
  for (let i = 0; i < size; i++) {
    const r = orientation === 'vertical' ? row + i : row
    const c = orientation === 'horizontal' ? col + i : col
    coords.push([r, c])
  }
  return coords
}

// Проверка возможности расстановки корабля (с правилом ореола в 1 клетку во всех 8 направлениях)
export function canPlaceShip(
  board: CellData[][],
  row: number,
  col: number,
  size: ShipType,
  orientation: ShipOrientation,
  excludeShipId: string | null = null
): boolean {
  const coords = getShipCoordinates(row, col, size, orientation)

  // 1. Проверка выхода за границы поля
  for (const [r, c] of coords) {
    if (!isValidCoordinate(r, c)) {
      return false
    }
  }

  // 2. Проверка соприкосновения и наложения
  for (const [r, c] of coords) {
    // Проверяем саму клетку и все 8 клеток вокруг нее
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (isValidCoordinate(nr, nc)) {
          const neighbor = board[nr][nc]
          if (neighbor.shipId && neighbor.shipId !== excludeShipId) {
            return false
          }
        }
      }
    }
  }

  return true
}

// Заполнение доски на основе расставленного флота
export function populateBoardWithFleet(fleet: PlacedShip[]): CellData[][] {
  const board = createEmptyBoard()
  for (const ship of fleet) {
    for (const [r, c] of ship.coords) {
      board[r][c].state = 'ship'
      board[r][c].shipId = ship.id
    }
  }
  return board
}

// Генерация случайной валидной расстановки всего флота
export function generateRandomFleet(): PlacedShip[] {
  let attempts = 0
  while (attempts < 500) {
    attempts++
    const board = createEmptyBoard()
    const fleet: PlacedShip[] = []
    let failed = false

    // Разворачиваем список кораблей от крупных к мелким
    const shipList: { size: ShipType; name: string }[] = []
    for (const item of FLEET_CONFIG) {
      for (let i = 0; i < item.count; i++) {
        shipList.push({ size: item.size, name: item.name })
      }
    }

    for (let idx = 0; idx < shipList.length; idx++) {
      const { size, name } = shipList[idx]
      let placed = false
      let innerTries = 0

      while (!placed && innerTries < 150) {
        innerTries++
        const orientation: ShipOrientation = Math.random() < 0.5 ? 'horizontal' : 'vertical'
        const maxRow = orientation === 'vertical' ? BOARD_SIZE - size : BOARD_SIZE - 1
        const maxCol = orientation === 'horizontal' ? BOARD_SIZE - size : BOARD_SIZE - 1

        const row = Math.floor(Math.random() * (maxRow + 1))
        const col = Math.floor(Math.random() * (maxCol + 1))

        if (canPlaceShip(board, row, col, size, orientation)) {
          const id = `ship_${size}_${idx}`
          const coords = getShipCoordinates(row, col, size, orientation)

          for (const [r, c] of coords) {
            board[r][c].state = 'ship'
            board[r][c].shipId = id
          }

          fleet.push({
            id,
            size,
            name,
            row,
            col,
            orientation,
            hits: 0,
            isSunk: false,
            coords,
          })
          placed = true
        }
      }

      if (!placed) {
        failed = true
        break
      }
    }

    if (!failed) {
      return fleet
    }
  }

  // Гарантированный запасной вариант при редкой неудаче
  return []
}

// Подсчет нерасставленных кораблей
export function getRemainingShipsToPlace(fleet: PlacedShip[]): Record<ShipType, number> {
  const counts: Record<ShipType, number> = { 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const item of FLEET_CONFIG) {
    counts[item.size] = item.count
  }
  for (const ship of fleet) {
    counts[ship.size] = Math.max(0, counts[ship.size] - 1)
  }
  return counts
}

// Выполнение выстрела по доске и обновление состояния
export function executeShot(
  board: CellData[][],
  fleet: PlacedShip[],
  row: number,
  col: number
): {
  nextBoard: CellData[][]
  nextFleet: PlacedShip[]
  shotResult: ShotResult
} {
  if (!isValidCoordinate(row, col)) {
    throw new Error('Координата выстрела вне поля')
  }

  const targetCell = board[row][col]

  // Если в клетку уже стреляли
  if (targetCell.state === 'miss' || targetCell.state === 'hit' || targetCell.state === 'sunk') {
    return {
      nextBoard: board,
      nextFleet: fleet,
      shotResult: { row, col, result: 'miss' },
    }
  }

  const nextBoard = board.map((r) => r.map((c) => ({ ...c })))
  const nextFleet = fleet.map((s) => ({ ...s, coords: [...s.coords] }))

  // 1. Промах
  if (targetCell.state === 'empty') {
    nextBoard[row][col].state = 'miss'
    return {
      nextBoard,
      nextFleet,
      shotResult: { row, col, result: 'miss' },
    }
  }

  // 2. Попадание в корабль
  const hitShip = nextFleet.find((s) => s.id === targetCell.shipId)
  if (!hitShip) {
    nextBoard[row][col].state = 'miss'
    return {
      nextBoard,
      nextFleet,
      shotResult: { row, col, result: 'miss' },
    }
  }

  hitShip.hits += 1
  nextBoard[row][col].state = 'hit'

  // Проверка, потоплен ли корабль полностью
  if (hitShip.hits >= hitShip.size) {
    hitShip.isSunk = true

    // Отмечаем все сегменты как потопленные
    for (const [r, c] of hitShip.coords) {
      nextBoard[r][c].state = 'sunk'
    }

    // Автоматическая обводка ореола (все пустые клетки вокруг потопленного помечаем как miss)
    for (const [sr, sc] of hitShip.coords) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = sr + dr
          const nc = sc + dc
          if (isValidCoordinate(nr, nc)) {
            if (nextBoard[nr][nc].state === 'empty') {
              nextBoard[nr][nc].state = 'miss'
            }
          }
        }
      }
    }

    return {
      nextBoard,
      nextFleet,
      shotResult: { row, col, result: 'sunk', sunkShip: hitShip },
    }
  }

  return {
    nextBoard,
    nextFleet,
    shotResult: { row, col, result: 'hit' },
  }
}

// Проверка, разбит ли флот полностью
export function isFleetDefeated(fleet: PlacedShip[]): boolean {
  return fleet.length > 0 && fleet.every((ship) => ship.isSunk)
}

export function createInitialBattleshipState(
  difficulty: BattleshipDifficulty = 'medium'
): BattleshipState {
  return {
    phase: 'placement',
    difficulty,
    playerBoard: createEmptyBoard(),
    playerFleet: [],
    botBoard: createEmptyBoard(),
    botFleet: [],
    currentTurn: 'player',
    winner: null,
    shotsFired: { player: 0, bot: 0 },
    hitsCount: { player: 0, bot: 0 },
    startTime: Date.now(),
    isBotThinking: false,
    selectedShipSize: 4,
    placementOrientation: 'horizontal',
    lastBotShot: null,
    lastPlayerShot: null,
    battleLog: ['Расставьте корабли на своём поле или нажмите «Случайно»'],
  }
}
