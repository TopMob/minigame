// Движок игры Змейка: классическая аркадная физика сетки

import type { GameEngine } from '../_lib/types'
import type { SnakeState, SnakeAction, SnakeOptions, Point, Direction } from './types'
import { SNAKE_DIFFICULTY_CONFIG } from './types'

const DEFAULT_GRID_SIZE = 20

export function isOppositeDirection(current: Direction, next: Direction): boolean {
  return (
    (current === 'UP' && next === 'DOWN') ||
    (current === 'DOWN' && next === 'UP') ||
    (current === 'LEFT' && next === 'RIGHT') ||
    (current === 'RIGHT' && next === 'LEFT')
  )
}

function getRandomFood(gridSize: number, snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`))
  const available: Point[] = []

  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) {
        available.push({ x, y })
      }
    }
  }

  if (available.length === 0) {
    return { x: 0, y: 0 }
  }

  const index = Math.floor(Math.random() * available.length)
  return available[index]
}

export const snakeEngine: GameEngine<SnakeState, SnakeAction, SnakeOptions> = {
  createInitialState(opts: SnakeOptions = {}): SnakeState {
    const gridSize = opts.gridSize ?? DEFAULT_GRID_SIZE
    const difficulty = opts.difficulty ?? 'medium'

    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]

    const food = getRandomFood(gridSize, initialSnake)

    return {
      snake: initialSnake,
      direction: 'RIGHT',
      food,
      foodType: 'normal',
      foodTimer: 0,
      score: 0,
      bestScore: 0,
      difficulty,
      isOver: false,
      isPaused: false,
      gridSize,
      moves: 0,
      applesEaten: 0,
    }
  },

  applyAction(state: SnakeState, action: SnakeAction): SnakeState {
    if (action.type === 'restart') {
      const fresh = snakeEngine.createInitialState({
        difficulty: state.difficulty,
        gridSize: state.gridSize,
      })
      return {
        ...fresh,
        bestScore: state.bestScore,
      }
    }

    if (action.type === 'setDifficulty') {
      return {
        ...state,
        difficulty: action.difficulty,
      }
    }

    if (action.type === 'pause') {
      return { ...state, isPaused: true }
    }

    if (action.type === 'resume') {
      return { ...state, isPaused: false }
    }

    if (action.type === 'setDirection') {
      if (state.isOver || isOppositeDirection(state.direction, action.direction)) {
        return state
      }
      return {
        ...state,
        direction: action.direction,
      }
    }

    if (action.type === 'tick') {
      if (state.isOver || state.isPaused) {
        return state
      }

      const head = state.snake[0]
      const delta = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
      }[state.direction]

      const newHead: Point = {
        x: head.x + delta.x,
        y: head.y + delta.y,
      }

      // Проверка столкновения со стеной
      if (
        newHead.x < 0 ||
        newHead.x >= state.gridSize ||
        newHead.y < 0 ||
        newHead.y >= state.gridSize
      ) {
        return {
          ...state,
          isOver: true,
        }
      }

      // Проверка столкновения с собственным хвостом
      const isSelfCollision = state.snake.slice(0, -1).some(
        (segment) => segment.x === newHead.x && segment.y === newHead.y
      )

      if (isSelfCollision) {
        return {
          ...state,
          isOver: true,
        }
      }

      // Проверка съедания еды
      const isEating = newHead.x === state.food.x && newHead.y === state.food.y
      const config = SNAKE_DIFFICULTY_CONFIG[state.difficulty] ?? SNAKE_DIFFICULTY_CONFIG.medium
      const multiplier = config.scoreMultiplier

      let newScore = state.score
      let newApplesEaten = state.applesEaten
      let newFood = state.food
      let newFoodType = state.foodType
      let newFoodTimer = state.foodTimer

      let newSnake: Point[]

      if (isEating) {
        const points = (state.foodType === 'golden' ? 5 : 1) * 10 * multiplier
        newScore += points
        newApplesEaten += 1

        // Змейка растет: добавляем новую голову, не удаляем хвост
        newSnake = [newHead, ...state.snake]

        // Определяем тип следующей еды: золотое яблоко каждые 5 яблок
        const shouldSpawnGolden = newApplesEaten % 5 === 0
        newFoodType = shouldSpawnGolden ? 'golden' : 'normal'
        newFoodTimer = shouldSpawnGolden ? 40 : 0
        newFood = getRandomFood(state.gridSize, newSnake)
      } else {
        // Обычное движение: добавляем новую голову, убираем последний элемент хвоста
        newSnake = [newHead, ...state.snake.slice(0, -1)]

        // Уменьшаем таймер золотого яблока
        if (state.foodType === 'golden') {
          if (state.foodTimer <= 1) {
            newFoodType = 'normal'
            newFoodTimer = 0
            newFood = getRandomFood(state.gridSize, newSnake)
          } else {
            newFoodTimer -= 1
          }
        }
      }

      const newBestScore = Math.max(state.bestScore, newScore)

      return {
        ...state,
        snake: newSnake,
        food: newFood,
        foodType: newFoodType,
        foodTimer: newFoodTimer,
        score: newScore,
        bestScore: newBestScore,
        moves: state.moves + 1,
        applesEaten: newApplesEaten,
      }
    }

    return state
  },

  isValidAction(state: SnakeState, action: SnakeAction): boolean {
    if (action.type === 'restart') return true
    if (action.type === 'tick') return !state.isOver && !state.isPaused
    if (action.type === 'setDirection') {
      return !state.isOver && !isOppositeDirection(state.direction, action.direction)
    }
    return true
  },

  isGameOver(state: SnakeState): boolean {
    return state.isOver
  },

  getScore(state: SnakeState): number {
    return state.score
  },

  hashState(state: SnakeState): string {
    const head = state.snake[0]
    return `${head.x},${head.y}:${state.score}:${state.moves}`
  },
}