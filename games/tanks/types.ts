// Типы и константы для игры Танчики (Battle City / 2D Top-Down Tanks)

export type Direction = 'up' | 'down' | 'left' | 'right'

export const TileType = {
  EMPTY: 0,
  BRICK: 1,
  STEEL: 2,
  WATER: 3,
  FOREST: 4,
  ICE: 5,
  BASE: 6,
  BASE_DESTROYED: 7,
} as const

export type TileTypeValue = typeof TileType[keyof typeof TileType]

export type TankType = 'player' | 'scout' | 'light' | 'assault' | 'heavy'

export type PowerupType = 'star' | 'shield' | 'bomb' | 'timer' | 'shovel' | 'life'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyConfig {
  lives: number
  enemyBaseSpeed: number
  bulletSpeed: number
  playerBulletSpeed: number
  enemyShootMin: number
  enemyShootMax: number
  powerupChance: number
  spawnInterval: number
  maxActiveEnemies: number
  totalEnemies: number
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    lives: 4,
    enemyBaseSpeed: 1.0,
    bulletSpeed: 2.8,
    playerBulletSpeed: 4.2,
    enemyShootMin: 100,
    enemyShootMax: 200,
    powerupChance: 0.35,
    spawnInterval: 170,
    maxActiveEnemies: 4,
    totalEnemies: 16,
  },
  medium: {
    lives: 3,
    enemyBaseSpeed: 1.25,
    bulletSpeed: 3.4,
    playerBulletSpeed: 4.5,
    enemyShootMin: 70,
    enemyShootMax: 150,
    powerupChance: 0.22,
    spawnInterval: 140,
    maxActiveEnemies: 4,
    totalEnemies: 20,
  },
  hard: {
    lives: 2,
    enemyBaseSpeed: 1.5,
    bulletSpeed: 4.0,
    playerBulletSpeed: 4.8,
    enemyShootMin: 45,
    enemyShootMax: 110,
    powerupChance: 0.16,
    spawnInterval: 110,
    maxActiveEnemies: 5,
    totalEnemies: 24,
  },
}

export const GRID_SIZE = 26
export const TILE_SIZE = 16
export const MAP_SIZE = GRID_SIZE * TILE_SIZE // 416
export const TANK_SIZE = 28 // 28x28 (при ячейке 16х16 это почти 2 тайла, отлично помещается в 32-пиксельный проход)
export const BULLET_SIZE = 5

export interface Tank {
  id: string
  x: number
  y: number
  dir: Direction
  speed: number
  type: TankType
  hp: number
  maxHp: number
  isPlayer: boolean
  tier: number // 1 - 4
  isFlashingBonus: boolean
  shootCooldown: number
  shieldTimer: number
  trackTimer: number
  slideX: number
  slideY: number
  isFrozen?: boolean
}

export interface Bullet {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  dir: Direction
  owner: 'player' | 'enemy'
  speed: number
  canBreakSteel: boolean
  tankId: string
}

export interface Powerup {
  id: string
  x: number
  y: number
  type: PowerupType
  life: number // тики жизни (исчезает через ~20 сек)
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  maxLife: number
  life: number
  kind: 'spark' | 'smoke' | 'fire' | 'brick' | 'shockwave'
}

export interface TrackMark {
  x: number
  y: number
  dir: Direction
  alpha: number
}

export interface FloatingText {
  id: string
  text: string
  x: number
  y: number
  color: string
  alpha: number
  life: number
}

export interface TanksState {
  difficulty: Difficulty
  stage: number
  score: number
  highScore: number
  lives: number
  isGameOver: boolean
  isVictory: boolean
  isPaused: boolean
  stageCleared: boolean
  baseDestroyed: boolean
  enemiesRemaining: number
  enemySpawnTimer: number
  freezeTimer: number
  shovelTimer: number
  screenShake: number
  player: Tank
  enemies: Tank[]
  bullets: Bullet[]
  powerups: Powerup[]
  particles: Particle[]
  trackMarks: TrackMark[]
  floatingTexts: FloatingText[]
  grid: number[][] // 26x26
  enemyTanksDestroyed: {
    scout: number
    light: number
    assault: number
    heavy: number
  }
}
