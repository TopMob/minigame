// Физика тенниса / пинг-понга в 3D пространстве с перспективной проекцией от первого лица

import type { TennisBall, TennisPlayer, TennisOpponent } from './types'
import {
  TABLE_WIDTH,
  TABLE_LENGTH,
  NET_Z,
  NET_HEIGHT,
  BALL_RADIUS,
  PADDLE_RADIUS_X,
  PADDLE_RADIUS_Y,
  PLAYER_PADDLE_Z,
  OPPONENT_PADDLE_Z,
  CAMERA_X,
  CAMERA_Y,
  CAMERA_Z,
  FOCAL_LENGTH,
} from './types'

// Константы гравитации и воздуха (масштаб: см и секунды)
const GRAVITY = -680.0       // см/с² (тянет вниз по Y)
const AIR_DRAG = 0.00085     // сопротивление воздуха
const TABLE_RESTITUTION = 0.88 // коэффициент упругости отскока от стола
const TABLE_FRICTION = 0.94    // трение по X/Z при отскоке
const MAGNUS_COEFF = 0.08    // влияние вращения на дугу полета

export interface ProjectedPoint {
  x: number
  y: number
  scale: number
  visible: boolean
}

/**
 * Перспективная 3D проекция точки мира (x, y, z) в координаты экрана (px).
 * Камера находится в (CAMERA_X, CAMERA_Y, CAMERA_Z) и смотрит вдоль оси Z вглубь стола.
 */
export function project3D(
  x: number,
  y: number,
  z: number,
  viewWidth: number,
  viewHeight: number
): ProjectedPoint {
  const dz = z - CAMERA_Z
  if (dz <= 4) {
    return { x: 0, y: 0, scale: 0, visible: false }
  }

  const scale = FOCAL_LENGTH / dz
  const cx = viewWidth / 2
  // Линия горизонта чуть выше центра для отличного обзора стола
  const cy = viewHeight * 0.40

  const screenX = cx + (x - CAMERA_X) * scale
  // Ось Y направлена вверх, а на экране Y вниз
  const screenY = cy - (y - CAMERA_Y) * scale

  return {
    x: screenX,
    y: screenY,
    scale,
    visible: true,
  }
}

export interface BallStepResult {
  ball: TennisBall
  bouncedTable: boolean
  bouncedSide: 'player' | 'opponent' | null
  hitNet: boolean
  bounceCoords: { x: number; y: number; z: number } | null
}

/**
 * Шаг физики полета мяча за время dt (секунды).
 * Обрабатывает гравитацию, сопротивление, вращение, отскок от стола и сетку.
 */
export function stepBall3D(ball: TennisBall, dt: number): BallStepResult {
  let { x, y, z, vx, vy, vz, spinX, spinY, bouncesPlayer, bouncesOpponent, isSmash } = ball

  const prevZ = z
  const prevY = y

  // 1. Аэродинамика и вращение (эффект Магнуса)
  const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
  const dragFactor = Math.max(0.7, 1 - AIR_DRAG * speed * dt)
  vx *= dragFactor
  vy *= dragFactor
  vz *= dragFactor

  // Топспин (spinY > 0) прижимает мяч вниз, слайс поднимает
  vy += spinY * MAGNUS_COEFF * Math.abs(vz) * dt
  // Боковой спин уводит мяч в сторону
  vx += spinX * MAGNUS_COEFF * Math.abs(vz) * dt

  // Гравитация
  vy += GRAVITY * dt

  // Интегрирование позиции
  x += vx * dt
  y += vy * dt
  z += vz * dt

  // Затухание вращения
  spinX *= 0.985
  spinY *= 0.985

  let bouncedTable = false
  let bouncedSide: 'player' | 'opponent' | null = null
  let bounceCoords: { x: number; y: number; z: number } | null = null
  let hitNet = false

  // 2. Отскок от стола:
  // Стол находится в z: [0 .. TABLE_LENGTH], x: [-TABLE_WIDTH/2 .. TABLE_WIDTH/2], y = 0
  const halfW = TABLE_WIDTH / 2
  const isOnTableX = Math.abs(x) <= halfW + BALL_RADIUS
  const isOnTableZ = z >= -BALL_RADIUS && z <= TABLE_LENGTH + BALL_RADIUS

  if (isOnTableX && isOnTableZ) {
    if (y <= BALL_RADIUS && vy < 0) {
      y = BALL_RADIUS
      vy = Math.abs(vy) * TABLE_RESTITUTION

      // Влияние спина на отскок
      vz += spinY * 18.0
      vx += spinX * 12.0

      vx *= TABLE_FRICTION
      vz *= TABLE_FRICTION

      bouncedTable = true
      bounceCoords = { x, y: 0, z }

      if (z <= NET_Z) {
        bouncesPlayer++
        bouncedSide = 'player'
      } else {
        bouncesOpponent++
        bouncedSide = 'opponent'
      }
    }
  }

  // 3. Проверка столкновения с сеткой:
  // Сетка расположена в z = NET_Z, высота от y=0 до y=NET_HEIGHT
  const crossedNet = (prevZ < NET_Z && z >= NET_Z) || (prevZ > NET_Z && z <= NET_Z)
  if (crossedNet && Math.abs(x) <= halfW + 6) {
    // Высота в момент пролета над сеткой (линейная интерполяция)
    const tNet = (NET_Z - prevZ) / (z - prevZ || 1)
    const yAtNet = prevY + (y - prevY) * tNet

    if (yAtNet <= NET_HEIGHT && yAtNet >= 0) {
      hitNet = true
      // Застревание в сетке / отскок вниз
      z = prevZ
      vz = -vz * 0.25
      vy = -Math.abs(vy) * 0.4
    }
  }

  return {
    ball: {
      x,
      y,
      z,
      vx,
      vy,
      vz,
      spinX,
      spinY,
      bouncesPlayer,
      bouncesOpponent,
      isSmash,
    },
    bouncedTable,
    bouncedSide,
    hitNet,
    bounceCoords,
  }
}

/**
 * Проверка столкновения мяча с ракеткой игрока (ближняя зона).
 * Использует непрерывную проверку (swept-check), чтобы мяч на высокой скорости не пролетал сквозь ракетку.
 */
export function checkPlayerHit(
  ball: TennisBall,
  prevBallZ: number,
  player: TennisPlayer
): { hit: boolean; newBall: TennisBall; isSmash: boolean } {
  // Игрок может отбить мяч только если он летит НА игрока (vz < 0)
  if (ball.vz >= 0) {
    return { hit: false, newBall: ball, isSmash: false }
  }

  // Плоскость контакта ракетки игрока
  const hitPlaneZ = PLAYER_PADDLE_Z

  // Проверяем, пересек ли мяч плоскость ракетки в этом кадре или находится рядом
  const crossedPlane = (prevBallZ >= hitPlaneZ && ball.z <= hitPlaneZ + 12) ||
                       (ball.z >= hitPlaneZ - 10 && ball.z <= hitPlaneZ + 15)

  if (!crossedPlane) {
    return { hit: false, newBall: ball, isSmash: false }
  }

  // Расстояние от центра ракетки до мяча
  const dx = ball.x - player.x
  const dy = ball.y - player.y

  // Эллиптическая зона ракетки
  const normX = dx / (PADDLE_RADIUS_X * 1.35)
  const normY = dy / (PADDLE_RADIUS_Y * 1.35)
  const distSq = normX * normX + normY * normY

  if (distSq > 1.3) {
    return { hit: false, newBall: ball, isSmash: false }
  }

  // ── УДАР СОСТОЯЛСЯ! Вычисляем новую скорость и угол ──────────────────────
  const mouseSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy)
  const isSmash = mouseSpeed > 320 || player.swingPower > 0.75

  // Базовая скорость вперед вглубь стола
  let baseForwardSpeed = 240 + (isSmash ? 200 : player.swingPower * 140)
  // Добавляем скорость ракетки вперед / вверх
  if (player.vy > 0) {
    baseForwardSpeed += Math.min(160, player.vy * 0.3)
  }

  // Горизонтальный угол: зависит от точки касания на ракетке и бокового взмаха
  const lateralSpeed = dx * 6.5 + player.vx * 0.45
  const newVX = Math.max(-280, Math.min(280, lateralSpeed))

  // Вертикальный подъем: должен перебросить сетку
  let newVY = 120 + dy * 4.0 + player.vy * 0.25
  if (isSmash) {
    // При мощном смэше мяч летит более полого и с сильным топспином
    newVY = Math.max(70, Math.min(170, newVY))
  } else {
    newVY = Math.max(90, Math.min(240, newVY))
  }

  const newVZ = Math.max(220, baseForwardSpeed)

  // Вращение мяча
  const spinX = (player.vx / 300) * 1.5
  const spinY = (isSmash ? 1.4 : 0.4) + (player.vy / 250) * 0.8

  const newBall: TennisBall = {
    ...ball,
    z: hitPlaneZ + 2,
    vx: newVX,
    vy: newVY,
    vz: newVZ,
    spinX: Math.max(-2, Math.min(2, spinX)),
    spinY: Math.max(-1.5, Math.min(2.5, spinY)),
    bouncesPlayer: 0,
    bouncesOpponent: 0,
    isSmash,
  }

  return { hit: true, newBall, isSmash }
}

/**
 * Проверка столкновения мяча с ракеткой соперника (дальняя зона).
 */
export function checkOpponentHit(
  ball: TennisBall,
  prevBallZ: number,
  opponent: TennisOpponent,
  accuracy: number,
  power: number
): { hit: boolean; newBall: TennisBall } {
  // Соперник отбивает мяч, летящий от игрока (vz > 0)
  if (ball.vz <= 0) {
    return { hit: false, newBall: ball }
  }

  const hitPlaneZ = OPPONENT_PADDLE_Z

  const crossedPlane = (prevBallZ <= hitPlaneZ && ball.z >= hitPlaneZ - 14) ||
                       (ball.z >= hitPlaneZ - 12 && ball.z <= hitPlaneZ + 15)

  if (!crossedPlane) {
    return { hit: false, newBall: ball }
  }

  const dx = ball.x - opponent.x
  const dy = ball.y - opponent.y

  const normX = dx / (PADDLE_RADIUS_X * 1.25)
  const normY = dy / (PADDLE_RADIUS_Y * 1.25)
  const distSq = normX * normX + normY * normY

  if (distSq > 1.25) {
    return { hit: false, newBall: ball }
  }

  // Бот нацеливает мяч обратно на половину игрока
  // Целевая точка: центр или случайное смещение
  const targetX = (Math.random() - 0.5) * (TABLE_WIDTH * 0.7 * accuracy)
  const tTravel = 0.75 + Math.random() * 0.25

  const newVX = (targetX - ball.x) / tTravel
  const newVZ = -(220 + power * 150)
  const newVY = 110 + (Math.random() * 40)

  const newBall: TennisBall = {
    ...ball,
    z: hitPlaneZ - 2,
    vx: Math.max(-220, Math.min(220, newVX)),
    vy: newVY,
    vz: newVZ,
    spinX: (Math.random() - 0.5) * 0.8,
    spinY: 0.3 + power * 0.5,
    bouncesPlayer: 0,
    bouncesOpponent: 0,
    isSmash: power > 0.85 && Math.random() > 0.6,
  }

  return { hit: true, newBall }
}

/** Пружинная интерполяция с учетом инерции */
export function springLerp(current: number, target: number, speed: number, dt: number): number {
  const diff = target - current
  const step = diff * Math.min(1.0, speed * dt)
  return current + step
}
