// ИИ-соперник для настольного тенниса в 3D от первого лица

import type { TennisState, TennisOpponent, TennisBall } from './types'
import {
  TABLE_WIDTH,
  OPPONENT_PADDLE_Z,
  TENNIS_DIFFICULTY_CONFIG,
} from './types'
import { checkOpponentHit, springLerp } from './physics'

export interface OpponentTickResult {
  opponent: TennisOpponent
  hitBall: TennisBall | null
}

/**
 * Обновление состояния ракетки соперника в 3D
 */
export function tickOpponent3D(
  state: TennisState,
  prevBallZ: number,
  dt: number
): OpponentTickResult {
  const { opponent, ball, difficulty } = state
  const config = TENNIS_DIFFICULTY_CONFIG[difficulty]

  const { x, y } = opponent
  let { targetX, targetY, reactionTimer, hitTimer } = opponent
  let hitBall: TennisBall | null = null

  // Убывание таймеров
  reactionTimer -= dt * 1000
  hitTimer = Math.max(0, hitTimer - dt * 1000)

  const isBallComingToBot = ball.vz > 0

  if (isBallComingToBot) {
    if (reactionTimer <= 0) {
      // Предсказываем точку прибытия мяча к плоскости ракетки бота
      const remainingZ = OPPONENT_PADDLE_Z - ball.z
      const timeToPlane = remainingZ / (ball.vz || 1)

      let predX = ball.x + ball.vx * timeToPlane
      // Ограничиваем шум точности
      const inaccuracy = (1 - config.opponentAccuracy) * (TABLE_WIDTH * 0.28)
      predX += (Math.random() - 0.5) * inaccuracy

      // Ограничиваем в пределах стола
      const halfW = TABLE_WIDTH / 2 + 10
      targetX = Math.max(-halfW, Math.min(halfW, predX))

      // Высота ракетки: мяч обычно на высоте отскока 15-35 см
      const predY = Math.max(12, Math.min(45, ball.y + 5 + (Math.random() - 0.5) * 8))
      targetY = predY

      // Следующий пересчет реакции
      reactionTimer = config.opponentReaction * (0.8 + Math.random() * 0.4)
    }
  } else {
    // Мяч летит к игроку: возвращаемся в центр стола
    targetX = 0
    targetY = 22
  }

  // Плавное движение к целевой точке с ограничением скорости бота
  const moveSpeed = config.opponentSpeed / 18
  const newX = springLerp(x, targetX, moveSpeed, dt)
  const newY = springLerp(y, targetY, moveSpeed, dt)

  const vx = (newX - x) / (dt || 0.016)
  const vy = (newY - y) / (dt || 0.016)

  const updatedOpponent: TennisOpponent = {
    x: newX,
    y: newY,
    z: OPPONENT_PADDLE_Z,
    targetX,
    targetY,
    vx,
    vy,
    reactionTimer,
    isHitting: hitTimer > 0,
    hitTimer,
  }

  // Проверяем возможность удара
  if (state.lastHitBy !== 'opponent' && state.phase === 'rally') {
    const hitCheck = checkOpponentHit(
      ball,
      prevBallZ,
      updatedOpponent,
      config.opponentAccuracy,
      config.opponentPower
    )

    if (hitCheck.hit) {
      hitBall = hitCheck.newBall
      updatedOpponent.isHitting = true
      updatedOpponent.hitTimer = 220
    }
  }

  return {
    opponent: updatedOpponent,
    hitBall,
  }
}

export function createInitialOpponent(): TennisOpponent {
  return {
    x: 0,
    y: 22,
    z: OPPONENT_PADDLE_Z,
    targetX: 0,
    targetY: 22,
    vx: 0,
    vy: 0,
    reactionTimer: 0,
    isHitting: false,
    hitTimer: 0,
  }
}
