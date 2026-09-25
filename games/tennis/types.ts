// Типы для игры Теннис / Пинг-понг (вид от первого лица / 3D перспектива стола)

export type TennisPhase = 'serve' | 'rally' | 'pointEnd' | 'gameEnd'
export type TennisDifficulty = 'easy' | 'medium' | 'hard'
export type HitBy = 'player' | 'opponent' | null

export interface Vector3D {
  x: number // горизонталь стола (-TABLE_WIDTH/2 .. +TABLE_WIDTH/2)
  y: number // высота над столом (0 = поверхность стола, >0 в воздухе)
  z: number // глубина (0 = ближний край игрока, NET_Z = сетка, TABLE_LENGTH = край соперника)
}

export interface TennisBall extends Vector3D {
  vx: number
  vy: number
  vz: number
  spinX: number // боковое вращение
  spinY: number // верхнее/нижнее вращение (топспин / подрезка)
  bouncesPlayer: number   // число отскоков на половине игрока после последнего удара
  bouncesOpponent: number // число отскоков на половине соперника после последнего удара
  isSmash?: boolean
}

export interface TennisPlayer {
  x: number       // 3D координата X
  y: number       // 3D координата Y (высота ракетки)
  z: number       // 3D координата Z (~ 0)
  targetX: number
  targetY: number
  vx: number      // скорость движения ракетки
  vy: number
  tiltX: number   // угол наклона по X
  tiltY: number   // угол наклона по Y
  swingPower: number // 0..1
  isHitting: boolean
  hitTimer: number
}

export interface TennisOpponent {
  x: number
  y: number
  z: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  reactionTimer: number
  isHitting: boolean
  hitTimer: number
}

export interface TennisScore {
  playerPoints: number   // 0, 15, 30, 40, A
  opponentPoints: number
  playerGames: number
  opponentGames: number
  playerSets: number
  opponentSets: number
}

export interface TennisState {
  phase: TennisPhase
  ball: TennisBall
  player: TennisPlayer
  opponent: TennisOpponent
  score: TennisScore
  lastHitBy: HitBy
  serveBy: 'player' | 'opponent'
  botServeTimer: number
  slowMotionTimer: number
  faultReason: 'net' | 'out' | 'double_bounce' | 'miss' | null
  pointWinner: 'player' | 'opponent' | null
  elapsedMs: number
  difficulty: TennisDifficulty
  matchOver: boolean
  matchWinner: 'player' | 'opponent' | null
  rallyCount: number
}

export interface TennisInput {
  pixelX: number      // Координата X курсора в пикселях холста
  pixelY: number      // Координата Y курсора в пикселях холста
  viewWidth: number   // Текущая ширина холста
  viewHeight: number  // Текущая высота холста
  normalizedX: number // 0..1 по ширине экрана
  normalizedY: number // 0..1 по высоте экрана
  pointerVX: number   // скорость указателя
  pointerVY: number
}

export interface TennisOptions {
  difficulty?: TennisDifficulty
}

// ─── Геометрия 3D стола и камеры ─────────────────────────────────────────────

export const TABLE_WIDTH = 152.5    // ширина стола (см)
export const TABLE_LENGTH = 274.0   // длина стола (см)
export const NET_Z = TABLE_LENGTH / 2 // 137.0 см (центр стола)
export const NET_HEIGHT = 13.5      // высота сетки (см)
export const BALL_RADIUS = 3.0      // радиус мяча (см)

// Ракетки (компактный эргономичный размер ~15x17 см, не закрывающий обзор)
export const PADDLE_RADIUS_X = 7.5 // полуширина ракетки
export const PADDLE_RADIUS_Y = 8.5 // полувысота ракетки
export const PLAYER_PADDLE_Z = 0    // плоскость ракетки игрока
export const OPPONENT_PADDLE_Z = TABLE_LENGTH + 12 // за дальним краем стола

// Камера (от первого лица над ближним краем для широкоформатного обзора)
export const CAMERA_X = 0
export const CAMERA_Y = 56.0  // высота взгляда над столом
export const CAMERA_Z = -55.0 // расстояние назад от ближнего края
export const FOCAL_LENGTH = 280.0

export const SETS_TO_WIN = 2

export const TENNIS_DIFFICULTY_CONFIG: Record<
  TennisDifficulty,
  {
    label: string
    opponentSpeed: number    // скорость перемещения (см/с)
    opponentReaction: number // задержка реакции (мс)
    opponentAccuracy: number // 0..1
    opponentPower: number    // 0..1
  }
> = {
  easy:   { label: 'Лёгкий',  opponentSpeed: 160, opponentReaction: 380, opponentAccuracy: 0.50, opponentPower: 0.55 },
  medium: { label: 'Средний', opponentSpeed: 240, opponentReaction: 180, opponentAccuracy: 0.78, opponentPower: 0.75 },
  hard:   { label: 'Сложный', opponentSpeed: 340, opponentReaction: 70,  opponentAccuracy: 0.94, opponentPower: 0.95 },
}

/** Преобразование теннисных очков в строку (15, 30, 40, A) */
export function pointsToLabel(n: number): string {
  const map: Record<number, string> = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'A' }
  return map[n] ?? `${n}`
}
