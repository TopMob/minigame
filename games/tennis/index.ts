// Публичный API движка Теннис

export { tennisEngine } from './engine'
export type { TennisAction } from './engine'
export type {
  TennisState,
  TennisInput,
  TennisOptions,
  TennisBall,
  TennisPlayer,
  TennisOpponent,
  TennisScore,
  TennisPhase,
  TennisDifficulty,
} from './types'
export {
  COURT_W,
  COURT_H,
  NET_Y,
  NET_HEIGHT,
  PLAYER_BASE_Y,
  OPPONENT_BASE_Y,
  PADDLE_W,
  PADDLE_H,
  BALL_R,
  TENNIS_DIFFICULTY_CONFIG,
  SETS_TO_WIN,
  pointsToLabel,
} from './types'
