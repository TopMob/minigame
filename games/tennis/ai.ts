// AI-соперник для тенниса — реактивный бот с тремя уровнями сложности

import type { TennisState, TennisOpponent, TennisBall } from './types'
import { COURT_W, COURT_H, OPPONENT_BASE_Y, PADDLE_W, TENNIS_DIFFICULTY_CONFIG } from './types'
import { predictLandingX, applyHit, springLerp } from './physics'

/**
 * Обновляет состояние соперника-бота за один тик.
 * Чистая функция: (state, dt) => TennisOpponent + новый мяч (если был удар).
 */
export function tickOpponent(
  state: TennisState,
  dt: number
): { opponent: TennisOpponent; hitBall: TennisBall | null } {
  const { opponent, ball, difficulty } = state
  const config = TENNIS_DIFFICULTY_CONFIG[difficulty]

  let { x, y, targetX, targetY, reactionTimer } = opponent
  let hitBall: TennisBall | null = null

  // Уменьшаем таймер реакции
  reactionTimer -= dt * 1000
  if (reactionTimer < 0) reactionTimer = 0

  // Бот двигается только в своей зоне (верхняя треть)
  const botZoneMinY = 0
  const botZoneMaxY = COURT_H * 0.4

  // Обновляем цель только если таймер реакции истёк
  if (reactionTimer <= 0) {
    const isBallComingToBot = ball.vy < 0 // мяч летит в сторону бота

    if (isBallComingToBot) {
      // Предсказываем точку приземления
      const predictedX = predictLandingX(ball, OPPONENT_BASE_Y)
      // Добавляем шум реакции в зависимости от сложности
      const noise = (1 - config.opponentAccuracy) * COURT_W * 0.35
      targetX = predictedX + (Math.random() - 0.5) * noise
      targetY = OPPONENT_BASE_Y + (Math.random() - 0.5) * 30 * (1 - config.opponentAccuracy)
    } else {
      // Мяч не летит к боту — возвращаемся к центру
      targetX = COURT_W / 2
      targetY = OPPONENT_BASE_Y
    }

    // Ограничиваем зону
    targetX = Math.max(PADDLE_W / 2, Math.min(COURT_W - PADDLE_W / 2, targetX))
    targetY = Math.max(botZoneMinY, Math.min(botZoneMaxY, targetY))

    // Перезапускаем таймер реакции (случайное время в диапазоне)
    reactionTimer = config.opponentReaction * (0.7 + Math.random() * 0.6)
  }

  // Движение к цели через spring-lerp
  const stiffness = config.opponentSpeed / Math.max(1, Math.hypot(targetX - x, targetY - y))
  x = springLerp(x, targetX, Math.min(stiffness, 12), dt)
  y = springLerp(y, targetY, Math.min(stiffness, 12), dt)

  // Ограничение по зоне
  x = Math.max(PADDLE_W / 2, Math.min(COURT_W - PADDLE_W / 2, x))
  y = Math.max(botZoneMinY, Math.min(botZoneMaxY, y))

  // Проверяем контакт мяча с ракеткой бота
  const PADDLE_H_BOT = 10
  const canHit =
    state.lastHitBy !== 'opponent' &&
    ball.z <= 45 &&   // мяч достаточно низко
    ball.z >= -5 &&
    Math.abs(ball.x - x) < (PADDLE_W / 2 + 8) &&
    Math.abs(ball.y - y) < (PADDLE_H_BOT + 8) &&
    ball.vy < 0       // мяч летит к боту

  if (canHit) {
    // Вычисляем вектор удара
    const hitOffsetX = Math.max(-1, Math.min(1, (ball.x - x) / (PADDLE_W / 2)))
    const power = config.opponentPower * (0.8 + Math.random() * 0.2)

    // Небольшой разброс по X для цели удара (не идеальный прицел)
    const aimNoise = (1 - config.opponentAccuracy) * 80
    const aimX = COURT_W / 2 + (Math.random() - 0.5) * (COURT_W * 0.5) + (Math.random() - 0.5) * aimNoise

    // Скорость ракетки бота в момент удара
    const paddleVX = (aimX - ball.x) * 2
    const paddleVY = 200 + power * 300

    hitBall = applyHit(ball, paddleVX, paddleVY, hitOffsetX, 1, power)
  }

  return {
    opponent: { x, y, targetX, targetY, reactionTimer },
    hitBall,
  }
}

/** Создаёт начальное состояние бота */
export function createInitialOpponent(): TennisOpponent {
  return {
    x: COURT_W / 2,
    y: OPPONENT_BASE_Y,
    targetX: COURT_W / 2,
    targetY: OPPONENT_BASE_Y,
    reactionTimer: 0,
  }
}
