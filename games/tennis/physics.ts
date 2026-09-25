// Физика мяча для тенниса — чистые детерминированные функции без побочных эффектов

import type { TennisBall } from './types'
import { COURT_W, COURT_H, NET_Y, NET_HEIGHT, BALL_R } from './types'

// Физические константы
const GRAVITY = 1800        // ускорение падения (ед/сек²)
const AIR_DRAG = 0.018      // коэффициент сопротивления воздуха (на горизонталь)
const RESTITUTION = 0.78    // коэффициент упругости отскока
const GROUND_FRICTION = 0.82 // трение при отскоке (горизонт. скорость)
const MAGNUS_COEFF = 0.12   // эффект Магнуса (спин → кривая траектории)
const SPIN_DECAY = 0.94     // затухание спина за тик

export interface PhysicsResult {
  ball: TennisBall
  bounced: boolean      // произошёл ли отскок от корта в этом тике
  hitNet: boolean       // пересёк сетку по высоте ниже допустимого
  outOfBounds: boolean  // вышел за пределы корта
  bouncePoint: { x: number; y: number } | null // точка отскока для эффектов пыли
}

/**
 * Обновляет состояние мяча на один тик dt (в секундах).
 * Чистая функция: (ball, dt) => PhysicsResult
 */
export function stepBall(ball: TennisBall, dt: number): PhysicsResult {
  let { x, y, z, vx, vy, vz, spin } = ball

  // Сопротивление воздуха — замедляет горизонт. скорость
  const speed = Math.sqrt(vx * vx + vy * vy)
  const drag = 1 - AIR_DRAG * speed * dt
  vx *= drag
  vy *= drag

  // Эффект Магнуса: спин отклоняет горизонталь
  // Топспин (spin > 0) тянет вниз по корту (увеличивает vy), слайс — обратно
  vx += spin * MAGNUS_COEFF * vy * dt
  vy += spin * MAGNUS_COEFF * Math.abs(vy) * dt

  // Гравитация
  vz -= GRAVITY * dt

  // Интегрируем позицию
  x += vx * dt
  y += vy * dt
  z += vz * dt

  // Затухание спина
  spin *= SPIN_DECAY

  let bounced = false
  let bouncePoint: { x: number; y: number } | null = null

  // Отскок от корта (z <= 0)
  if (z <= 0) {
    z = 0
    vz = Math.abs(vz) * RESTITUTION

    // Спин влияет на направление отскока
    vy += spin * 0.4  // топспин ускоряет "прыжок вперёд"
    vx += spin * 0.15

    // Трение при отскоке
    vx *= GROUND_FRICTION
    vy *= GROUND_FRICTION

    // Если скорость z слишком мала — мяч остановился на полу
    if (vz < 40) {
      vz = 0
    }

    bounced = true
    bouncePoint = { x, y }
  }

  // Горизонтальные границы корта (боковые стены)
  if (x < BALL_R) {
    x = BALL_R
    vx = Math.abs(vx) * 0.7
  } else if (x > COURT_W - BALL_R) {
    x = COURT_W - BALL_R
    vx = -Math.abs(vx) * 0.7
  }

  // Проверка пересечения сетки
  // Сетка находится по Y = NET_Y, имеет высоту NET_HEIGHT
  let hitNet = false
  const prevY = y - vy * dt
  const crossedNet = (prevY < NET_Y && y >= NET_Y) || (prevY > NET_Y && y <= NET_Y)
  if (crossedNet && z < NET_HEIGHT && z >= 0) {
    hitNet = true
  }

  // Аут: мяч вышел за Y-границы корта (после отскока)
  const outOfBounds = y < -BALL_R || y > COURT_H + BALL_R

  const newBall: TennisBall = { x, y, z, vx, vy, vz, spin }
  return { ball: newBall, bounced, hitNet, outOfBounds, bouncePoint }
}

/** Проверяет, вышел ли мяч за пределы корта по X (сайд-аут) */
export function isSideOut(ball: TennisBall): boolean {
  return ball.x < 0 || ball.x > COURT_W
}

/**
 * Вычисляет вектор скорости мяча после удара ракеткой.
 *
 * @param ball         текущее состояние мяча
 * @param paddleVX     скорость ракетки по X (ед/сек)
 * @param paddleVY     скорость ракетки по Y
 * @param hitOffsetX   смещение точки контакта от центра ракетки (-1..1)
 * @param direction    1 = удар вверх (игрок), -1 = удар вниз (соперник)
 * @param power        0..1 сила удара
 * @returns новый мяч после удара
 */
export function applyHit(
  ball: TennisBall,
  paddleVX: number,
  paddleVY: number,
  hitOffsetX: number,
  direction: 1 | -1,
  power: number
): TennisBall {
  // Базовая скорость после удара: смесь входящей и скорости ракетки
  const BASE_SPEED = 480 + power * 380
  const paddleSpeedY = Math.abs(paddleVY)

  // Чем быстрее движется ракетка — тем сильнее удар
  const impact = Math.min(1, paddleSpeedY / 500)
  const totalSpeed = BASE_SPEED * (0.6 + 0.4 * impact)

  // Горизонтальное отклонение: от смещения удара и горизонтальной скорости ракетки
  const lateralBias = hitOffsetX * totalSpeed * 0.45 + paddleVX * 0.5
  const newVX = Math.max(-700, Math.min(700, ball.vx * 0.2 + lateralBias))

  // Скорость по Y (направление к противнику)
  const depthSpeed = totalSpeed * 0.9
  const newVY = direction * (-depthSpeed) // direction=-1 → вверх по экрану

  // Начальная вертикальная скорость: поднимаем мяч над сеткой
  const liftBase = 420 + power * 260
  const newVZ = liftBase * (0.7 + 0.3 * impact)

  // Спин: боковая скорость ракетки → подкрутка
  const spin = (paddleVX / 500) * 0.8 + (paddleVY > 0 ? 0.4 : -0.3)

  return {
    ...ball,
    vx: newVX,
    vy: newVY,
    vz: newVZ,
    spin: Math.max(-1, Math.min(1, spin)),
  }
}

/**
 * Предсказывает точку, где мяч достигнет y=targetY (для AI).
 * Простая аналитическая аппроксимация (без гравитации — достаточно для бота).
 */
export function predictLandingX(ball: TennisBall, targetY: number): number {
  if (Math.abs(ball.vy) < 1) return ball.x
  const tTravel = Math.abs((targetY - ball.y) / ball.vy)
  let predictedX = ball.x + ball.vx * tTravel
  // Учитываем отражение от боковых стен
  while (predictedX < 0 || predictedX > COURT_W) {
    if (predictedX < 0) predictedX = -predictedX
    if (predictedX > COURT_W) predictedX = 2 * COURT_W - predictedX
  }
  return predictedX
}

/** Spring-lerp для плавного движения ракетки */
export function springLerp(current: number, target: number, stiffness: number, dt: number): number {
  return current + (target - current) * Math.min(1, stiffness * dt)
}
