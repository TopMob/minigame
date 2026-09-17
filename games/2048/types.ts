// Типы для игры 2048

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Tile {
  id: string
  value: number
  row: number
  col: number
  isMerged?: boolean
  isNew?: boolean
}

export interface Game2048State {
  tiles: Tile[]
  score: number
  bestScore: number
  moves: number
  isWon: boolean
  isOver: boolean
  keepPlaying: boolean
  size: number
}

export type Game2048Action =
  | { type: 'move'; direction: Direction }
  | { type: 'restart' }
  | { type: 'keepPlaying' }

export interface Game2048Options {
  size?: number
}
