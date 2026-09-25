'use client'

// TennisCourt — canvas-рендер корта с мячом, тенью, трейлом, частицами
// Все "juice" эффекты: squash&stretch, dust, trail, screen shake

import { useEffect, useRef, memo, useCallback } from 'react'
import type { TennisState } from '@/games/tennis/types'
import {
  COURT_W,
  COURT_H,
  NET_Y,
  NET_HEIGHT,
  PADDLE_W,
  PADDLE_H,
  BALL_R,
} from '@/games/tennis/types'

interface TennisCourtProps {
  state: TennisState
}

interface TrailPoint {
  x: number
  y: number
  z: number
  age: number // 0..1, возрастает → исчезает
}

interface DustParticle {
  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  r: number
}

// ── Canvas рендерер ──────────────────────────────────────────────────────────

export const TennisCourt = memo(function TennisCourt({ state }: TennisCourtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Трейл мяча
  const trailRef = useRef<TrailPoint[]>([])
  // Частицы пыли
  const dustRef = useRef<DustParticle[]>([])
  // Screen shake
  const shakeRef = useRef({ x: 0, y: 0, power: 0 })
  // Предыдущее состояние (для детектирования событий)
  const prevStateRef = useRef<TennisState | null>(null)
  // rAF
  const rafRef = useRef<number | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  // ── Спауним частицы пыли при отскоке ────────────────────────────────────
  const spawnDust = useCallback((cx: number, cy: number, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8
      const speed = 30 + Math.random() * 60
      dustRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.4,
        alpha: 0.7 + Math.random() * 0.3,
        r: 2 + Math.random() * 3,
      })
    }
    // Ограничение пула
    if (dustRef.current.length > 80) {
      dustRef.current = dustRef.current.slice(-80)
    }
  }, [])

  // ── Отрисовка ────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = stateRef.current
    const prev = prevStateRef.current

    // Детект событий для эффектов
    if (prev) {
      // Детект отскока: если z упал с >= 5 до < 5 → спауним пыль
      if (s.ball.z < 5 && prev.ball.z >= 5) {
        // Переводим позицию мяча в canvas-координаты
        const cx = (s.ball.x / COURT_W) * canvas.clientWidth
        const cy = (s.ball.y / COURT_H) * canvas.clientHeight
        spawnDust(cx, cy)
      }

      // Удар игрока → screen shake
      if (s.lastHitBy !== prev.lastHitBy && s.lastHitBy === 'player') {
        const power = s.player.swingPower
        if (power > 0.5) {
          shakeRef.current.power = power * 5
        }
      }

      // Очко → сильный shake
      if (s.pointWinner && !prev.pointWinner) {
        shakeRef.current.power = 4
      }
    }
    prevStateRef.current = s

    // Обновляем трейл
    const trail = trailRef.current
    const speed = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2)
    const showTrail = speed > 300 && s.phase === 'rally'
    if (showTrail) {
      trail.push({ x: s.ball.x, y: s.ball.y, z: s.ball.z, age: 0 })
      if (trail.length > 10) trail.shift()
    } else {
      // Быстро чистим трейл
      trailRef.current = trail.filter((p) => p.age < 0.8)
    }
    trail.forEach((p) => { p.age += 0.12 })

    // Обновляем частицы пыли
    const dust = dustRef.current
    const dtMs = 16 / 1000
    dust.forEach((p) => {
      p.x += p.vx * dtMs
      p.y += p.vy * dtMs
      p.alpha -= 0.04
      p.r *= 0.97
    })
    dustRef.current = dust.filter((p) => p.alpha > 0.02)

    // Screen shake
    const shake = shakeRef.current
    shake.power *= 0.82
    shake.x = (Math.random() - 0.5) * shake.power * 2
    shake.y = (Math.random() - 0.5) * shake.power * 2

    // ── Настройка canvas DPR ───────────────────────────────────────────────
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
    }
    ctx.save()
    ctx.scale(dpr, dpr)

    // Масштаб: виртуальные координаты → пиксели
    const scaleX = W / COURT_W
    const scaleY = H / COURT_H

    function vx(x: number) { return x * scaleX + shake.x }
    function vy(y: number) { return y * scaleY + shake.y }

    // ── Очистка ──────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H)

    // ── Корт (текстура) ───────────────────────────────────────────────────────
    // Фон — тёмно-синий (хард-корт)
    const courtGrad = ctx.createLinearGradient(0, 0, 0, H)
    courtGrad.addColorStop(0, '#1a3a5c')
    courtGrad.addColorStop(0.5, '#1e4976')
    courtGrad.addColorStop(1, '#1a3a5c')
    ctx.fillStyle = courtGrad
    ctx.fillRect(0, 0, W, H)

    // Линии корта
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 1.5

    // Базовые линии
    ctx.beginPath()
    ctx.rect(vx(20), vy(20), (COURT_W - 40) * scaleX, (COURT_H - 40) * scaleY)
    ctx.stroke()

    // Линия подачи (player side)
    const serveLine1Y = NET_Y + COURT_H * 0.13
    ctx.beginPath()
    ctx.moveTo(vx(20), vy(serveLine1Y))
    ctx.lineTo(vx(COURT_W - 20), vy(serveLine1Y))
    ctx.stroke()

    // Линия подачи (opponent side)
    const serveLine2Y = NET_Y - COURT_H * 0.13
    ctx.beginPath()
    ctx.moveTo(vx(20), vy(serveLine2Y))
    ctx.lineTo(vx(COURT_W - 20), vy(serveLine2Y))
    ctx.stroke()

    // Центральная линия по Y
    ctx.beginPath()
    ctx.moveTo(vx(COURT_W / 2), vy(20))
    ctx.lineTo(vx(COURT_W / 2), vy(COURT_H - 20))
    ctx.stroke()

    // Отметка центра для подачи
    ctx.beginPath()
    ctx.arc(vx(COURT_W / 2), vy(NET_Y), 4 * scaleX, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()

    ctx.restore()

    // ── Сетка ─────────────────────────────────────────────────────────────────
    ctx.save()
    // Тело сетки
    const netX0 = vx(10)
    const netX1 = vx(COURT_W - 10)
    const netTopY = vy(NET_Y) - NET_HEIGHT * scaleY
    const netBotY = vy(NET_Y)

    const netGrad = ctx.createLinearGradient(netX0, netTopY, netX0, netBotY)
    netGrad.addColorStop(0, 'rgba(255,255,255,0.9)')
    netGrad.addColorStop(1, 'rgba(200,200,200,0.6)')
    ctx.fillStyle = netGrad
    ctx.fillRect(netX0, netTopY, netX1 - netX0, netBotY - netTopY)

    // Ячейки сетки
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 0.8
    const cols = 18
    const colW = (netX1 - netX0) / cols
    for (let i = 1; i < cols; i++) {
      ctx.beginPath()
      ctx.moveTo(netX0 + i * colW, netTopY)
      ctx.lineTo(netX0 + i * colW, netBotY)
      ctx.stroke()
    }
    const rows = 4
    const rowH = (netBotY - netTopY) / rows
    for (let i = 1; i < rows; i++) {
      ctx.beginPath()
      ctx.moveTo(netX0, netTopY + i * rowH)
      ctx.lineTo(netX1, netTopY + i * rowH)
      ctx.stroke()
    }

    // Полоска наверху сетки (белая)
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillRect(netX0, netTopY - 3, netX1 - netX0, 4)

    // Металлические столбы по бокам
    ctx.fillStyle = '#c0c0c0'
    ctx.fillRect(netX0 - 5, netTopY - 6, 8, netBotY - netTopY + 8)
    ctx.fillRect(netX1 - 3, netTopY - 6, 8, netBotY - netTopY + 8)

    ctx.restore()

    // ── Тень мяча ────────────────────────────────────────────────────────────
    const ball = s.ball
    const shadowAlpha = Math.max(0, 0.55 - ball.z / 280)
    const shadowScale = Math.max(0.2, 1 - ball.z / 320)

    ctx.save()
    ctx.globalAlpha = shadowAlpha
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.ellipse(
      vx(ball.x),
      vy(ball.y),
      BALL_R * scaleX * shadowScale * 1.6,
      BALL_R * scaleY * shadowScale * 0.6,
      0, 0, Math.PI * 2
    )
    ctx.fill()
    ctx.restore()

    // ── Трейл (motion blur) ──────────────────────────────────────────────────
    if (showTrail) {
      trail.forEach((p, i) => {
        const alpha = (1 - p.age) * 0.3 * (i / trail.length)
        const r = BALL_R * scaleX * (1 - p.age * 0.4)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#c8e6ff'
        ctx.beginPath()
        ctx.arc(vx(p.x), vy(p.y), r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })
    }

    // ── Мяч (squash & stretch) ────────────────────────────────────────────────
    const bx = vx(ball.x)
    const by = vy(ball.y) - ball.z * scaleY * 0.7 // высота над кортом

    // Squash & stretch: при низком z — сплющивание
    const squashFactor = ball.z < 20 ? 1 - (1 - ball.z / 20) * 0.35 : 1
    const stretchX = BALL_R * scaleX / squashFactor
    const stretchY = BALL_R * scaleY * squashFactor

    // Подсветка при ударе
    const isJustHit = s.lastHitBy && (
      s.player.hitTimer > 100 ||
      (s.lastHitBy === 'opponent' && ball.vz > 300)
    )

    ctx.save()
    if (isJustHit) {
      ctx.shadowColor = s.lastHitBy === 'player' ? '#60a5fa' : '#f87171'
      ctx.shadowBlur = 18 * scaleX
    } else {
      ctx.shadowColor = 'rgba(200, 230, 255, 0.6)'
      ctx.shadowBlur = 8 * scaleX
    }

    // Основной цвет мяча (жёлто-зелёный теннисный)
    const ballGrad = ctx.createRadialGradient(
      bx - stretchX * 0.3, by - stretchY * 0.3, stretchX * 0.1,
      bx, by, stretchX
    )
    ballGrad.addColorStop(0, '#d4f542')
    ballGrad.addColorStop(0.6, '#a8d520')
    ballGrad.addColorStop(1, '#7aaa10')

    ctx.fillStyle = ballGrad
    ctx.beginPath()
    ctx.ellipse(bx, by, stretchX, stretchY, 0, 0, Math.PI * 2)
    ctx.fill()

    // Блик на мяче
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.ellipse(
      bx - stretchX * 0.25,
      by - stretchY * 0.25,
      stretchX * 0.32,
      stretchY * 0.22,
      -0.5, 0, Math.PI * 2
    )
    ctx.fill()
    ctx.restore()

    // ── Частицы пыли ─────────────────────────────────────────────────────────
    dustRef.current.forEach((p) => {
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = '#e2d8c0'
      ctx.beginPath()
      ctx.arc(p.x + shake.x, p.y + shake.y, p.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    // ── Ракетка игрока ────────────────────────────────────────────────────────
    drawPaddle(ctx, vx(s.player.x), vy(s.player.y), PADDLE_W * scaleX, PADDLE_H * scaleY, s.player.isHitting, 'player')

    // ── Ракетка соперника ─────────────────────────────────────────────────────
    drawPaddle(ctx, vx(s.opponent.x), vy(s.opponent.y), PADDLE_W * scaleX, PADDLE_H * scaleY, false, 'opponent')

    ctx.restore()
  }, [spawnDust])

  // ── rAF loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function loop() {
      rafRef.current = requestAnimationFrame(loop)
      draw()
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ touchAction: 'none', cursor: 'none' }}
    />
  )
})

// ─── Вспомогательные ──────────────────────────────────────────────────────────

function drawPaddle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  isHitting: boolean,
  side: 'player' | 'opponent'
) {
  ctx.save()

  // Squash&stretch в момент удара
  const scaleW = isHitting ? 1.18 : 1
  const scaleH = isHitting ? 0.7 : 1
  const pw = w * scaleW
  const ph = h * scaleH

  // Тень ракетки
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 6

  // Основной корпус
  const grad = ctx.createLinearGradient(cx - pw / 2, cy - ph / 2, cx - pw / 2, cy + ph / 2)
  if (side === 'player') {
    grad.addColorStop(0, isHitting ? '#93c5fd' : '#60a5fa')
    grad.addColorStop(1, isHitting ? '#2563eb' : '#1d4ed8')
  } else {
    grad.addColorStop(0, '#f87171')
    grad.addColorStop(1, '#b91c1c')
  }

  ctx.fillStyle = grad
  ctx.beginPath()
  roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, Math.min(pw, ph) * 0.45)
  ctx.fill()

  // Блик
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.beginPath()
  roundRect(ctx, cx - pw / 2 + 2, cy - ph / 2 + 1, pw * 0.6, ph * 0.4, ph * 0.3)
  ctx.fill()

  ctx.restore()
}

/** Полифил roundRect для canvas */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}
