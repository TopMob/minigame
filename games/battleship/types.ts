// Типы для игры Морской бой (Battleship)

export type ShipOrientation = 'horizontal' | 'vertical'

export type ShipType = 4 | 3 | 2 | 1

export interface ShipConfig {
  id: string
  size: ShipType
  name: string
}

// 10 классических кораблей русского морского боя (всего 20 палуб):
// 1 × 4-палубный (Линкор)
// 2 × 3-палубных (Крейсер)
// 3 × 2-палубных (Эсминец)
// 4 × 1-палубных (Торпедный катер)
export const FLEET_CONFIG: { size: ShipType; name: string; count: number }[] = [
  { size: 4, name: 'Линкор', count: 1 },
  { size: 3, name: 'Крейсер', count: 2 },
  { size: 2, name: 'Эсминец', count: 3 },
  { size: 1, name: 'Катер', count: 4 },
]

export const TOTAL_SHIPS = 10
export const TOTAL_DECKS = 20
export const BOARD_SIZE = 10

export const COLUMN_LETTERS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К']
export const ROW_NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

export interface PlacedShip {
  id: string
  size: ShipType
  name: string
  row: number
  col: number
  orientation: ShipOrientation
  hits: number
  isSunk: boolean
  coords: [number, number][]
}

export type CellState =
  | 'empty'     // вода без выстрела
  | 'miss'      // промах (точка)
  | 'ship'      // целый сегмент корабля (виден на своей доске)
  | 'hit'       // подбитый сегмент корабля (огонь)
  | 'sunk'      // потопленный сегмент корабля (крест)

export interface CellData {
  row: number
  col: number
  state: CellState
  shipId: string | null
}

export type GamePhase = 'placement' | 'battle' | 'game_over'
export type TurnPlayer = 'player' | 'bot'
export type BattleshipDifficulty = 'easy' | 'medium' | 'hard'

export interface ShotResult {
  row: number
  col: number
  result: 'miss' | 'hit' | 'sunk'
  sunkShip?: PlacedShip
}

export interface BattleshipState {
  phase: GamePhase
  difficulty: BattleshipDifficulty
  playerBoard: CellData[][]
  playerFleet: PlacedShip[]
  botBoard: CellData[][]
  botFleet: PlacedShip[]
  currentTurn: TurnPlayer
  winner: 'player' | 'bot' | null
  shotsFired: { player: number; bot: number }
  hitsCount: { player: number; bot: number }
  startTime: number
  isBotThinking: boolean
  selectedShipSize: ShipType | null
  placementOrientation: ShipOrientation
  lastBotShot: ShotResult | null
  lastPlayerShot: ShotResult | null
  battleLog: string[]
}
