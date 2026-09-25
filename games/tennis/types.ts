// Типы для игры Теннис (Tennis)

export type TennisPhase = 'serve' | 'rally' | 'pointEnd' | 'gameEnd'
export type TennisDifficulty = 'easy' | 'medium' | 'hard'
export type HitBy = 'player' | 'opponent' | null

export interface TennisBall {
  x: number    // горизонталь на корте (0..COURT_W)
  y: number    // глубина корта (0..COURT_H) — 0 у игрока, COURT_H у соперника
  z: number    // высота над кортом (>= 0)
  vx: number   // горизонтальная скорость
  vy: number   // скорость по глубине корта
  vz: number   // вертикальная скорость (вверх)
  spin: number // спин: >0 топспин (мяч ускоряется вперёд при отскоке), <0 слайс
}

export interface TennisPlayer {
  x: number       // текущая X позиция (центр ракетки)
  y: number       // текущая Y позиция
  targetX: number // цель (позиция мыши)
  targetY: number
  vx: number      // скорость ракетки (для расчёта удара)
  vy: number
  swingPower: number // 0..1, возрастает при быстром движении
  isHitting: boolean // true сразу после контакта (для анимации)
  hitTimer: number   // убывающий таймер удара (для squash&stretch)
}

export interface TennisOpponent {
  x: number
  y: number
  targetX: number
  targetY: number
  reactionTimer: number // задержка реакции бота
}

export interface TennisScore {
  // теннисные очки 0/15/30/40/advantage
  playerPoints: number   // 0,1,2,3,4 (4=advantage)
  opponentPoints: number
  // геймы в текущем сете
  playerGames: number
  opponentGames: number
  // сеты
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
  // эффекты: медленное воспроизведение на выигрышном очке
  slowMotionTimer: number // ms, убывает каждый тик
  // ошибка: попал в сетку или аут
  faultReason: 'net' | 'out' | 'double' | null
  pointWinner: 'player' | 'opponent' | null
  // суммарное время игры
  elapsedMs: number
  difficulty: TennisDifficulty
  // флаг окончания матча
  matchOver: boolean
  matchWinner: 'player' | 'opponent' | null
}

export interface TennisInput {
  mouseX: number   // нормализованные 0..1 координаты в рамке корта
  mouseY: number
  mouseVX: number  // скорость мыши (пикс/сек в нормализованных ед.)
  mouseVY: number
}

export interface TennisOptions {
  difficulty?: TennisDifficulty
}

// Размеры виртуального корта (безразмерные единицы)
export const COURT_W = 400
export const COURT_H = 600

// Позиции по глубине
export const NET_Y = COURT_H / 2          // сетка посередине
export const PLAYER_BASE_Y = COURT_H * 0.82 // исходная Y игрока
export const OPPONENT_BASE_Y = COURT_H * 0.18 // исходная Y соперника

// Размеры ракетки
export const PADDLE_W = 60
export const PADDLE_H = 12

// Мяч
export const BALL_R = 8

// Высота сетки
export const NET_HEIGHT = 40

// Количество сетов для победы в матче
export const SETS_TO_WIN = 2  // лучший из 3 сетов

export const TENNIS_DIFFICULTY_CONFIG: Record<
  TennisDifficulty,
  {
    label: string
    opponentSpeed: number    // скорость перемещения бота (ед/сек)
    opponentReaction: number // задержка реакции (мс)
    opponentAccuracy: number // 0..1 — точность прицела
    opponentPower: number    // 0..1 — сила удара
  }
> = {
  easy:   { label: 'Лёгкий',  opponentSpeed: 180, opponentReaction: 400, opponentAccuracy: 0.45, opponentPower: 0.5 },
  medium: { label: 'Средний', opponentSpeed: 260, opponentReaction: 220, opponentAccuracy: 0.70, opponentPower: 0.7 },
  hard:   { label: 'Сложный', opponentSpeed: 350, opponentReaction: 80,  opponentAccuracy: 0.92, opponentPower: 0.9 },
}

/** Преобразование tennis-очков в строку */
export function pointsToLabel(n: number): string {
  const map: Record<number, string> = { 0: '0', 1: '15', 2: '30', 3: '40', 4: 'A' }
  return map[n] ?? '?'
}
