// Типы для игры Змейка

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type FoodType = 'normal' | 'golden'

export interface Point {
  x: number
  y: number
}

export interface SnakeState {
  snake: Point[]
  direction: Direction
  food: Point
  foodType: FoodType
  foodTimer: number
  score: number
  bestScore: number
  difficulty: Difficulty
  isOver: boolean
  isPaused: boolean
  gridSize: number
  moves: number
  applesEaten: number
}

export type SnakeAction =
  | { type: 'setDirection'; direction: Direction }
  | { type: 'tick' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'restart' }
  | { type: 'setDifficulty'; difficulty: Difficulty }

export interface SnakeOptions {
  difficulty?: Difficulty
  gridSize?: number
}

export const SNAKE_DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; speedMs: number; scoreMultiplier: number }
> = {
  easy: { label: 'Лёгкий', speedMs: 140, scoreMultiplier: 1 },
  medium: { label: 'Средний', speedMs: 100, scoreMultiplier: 2 },
  hard: { label: 'Сложный', speedMs: 70, scoreMultiplier: 3 },
}