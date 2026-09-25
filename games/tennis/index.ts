// Публичный API движка Теннис (3D от первого лица)

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
  TABLE_WIDTH,
  TABLE_LENGTH,
  NET_Z,
  NET_HEIGHT,
  BALL_RADIUS,
  PADDLE_RADIUS_X,
  PADDLE_RADIUS_Y,
  PLAYER_PADDLE_Z,
  OPPONENT_PADDLE_Z,
  TENNIS_DIFFICULTY_CONFIG,
  SETS_TO_WIN,
  pointsToLabel,
} from './types'
export { project3D } from './physics'
