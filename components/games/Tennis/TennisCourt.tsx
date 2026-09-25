'use client'

// TennisCourt — 3D холст игры в теннис / пинг-понг от первого лица
// Единый производительный rAF-цикл (60-144 FPS) без лагов React, мгновенный отклик ракетки

import { useEffect, useRef, memo } from 'react'
import type { TennisState, TennisInput } from '@/games/tennis/types'
import {
  TABLE_WIDTH,
  TABLE_LENGTH,
  NET_Z,
  NET_HEIGHT,
  BALL_RADIUS,
  PADDLE_RADIUS_X,
  PADDLE_RADIUS_Y,
} from '@/games/tennis/types'
import { project3D } from '@/games/tennis/physics'
import { tennisEngine } from '@/games/tennis/engine'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'

interface TennisCourtProps {
  stateRef: React.MutableRefObject<TennisState>
  inputRef: React.MutableRefObject<TennisInput>
  onStateChange: (state: TennisState, isSmash?: boolean) => void
}

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  alpha: number
  color: string
  size: number
}

interface TrailItem {
  x: number
  y: number
  z: number
  alpha: number
}

export const TennisCourt = memo(function TennisCourt({
  stateRef,
  inputRef,
  onStateChange,
}: TennisCourtProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const trailRef = useRef<TrailItem[]>([])
  const shakeRef = useRef<{ x: number; y: number; power: number }>({ x: 0, y: 0, power: 0 })
  const lastTimeRef = useRef<number | null>(null)
  const recordedMatchRef = useRef(false)

  // Предыдущие значения для детекта звуков и эффектов
  const prevBallState = useRef({
    bouncesPlayer: 0,
    bouncesOpponent: 0,
    lastHitBy: null as TennisState['lastHitBy'],
    phase: 'serve' as TennisState['phase'],
    pointWinner: null as TennisState['pointWinner'],
  })

  useEffect(() => {
    let animId: number
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function renderLoop(time: number) {
      animId = requestAnimationFrame(renderLoop)
      if (!ctx || !canvas) return

      if (lastTimeRef.current === null) {
        lastTimeRef.current = time
        return
      }

      const rawDt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time
      // Ограничиваем dt при пропуске кадров
      const dt = Math.min(rawDt, 0.04)

      const currentState = stateRef.current
      const currentInput = inputRef.current

      // ── ШАГ ФИЗИКИ ДВИЖКА ──────────────────────────────────────────────────
      const nextState = tennisEngine.applyAction(currentState, {
        type: 'tick',
        dt,
        input: currentInput,
      })
      stateRef.current = nextState

      // ── ДЕТЕКТ СОБЫТИЙ ДЛЯ ЗВУКОВ И ЭФФЕКТОВ ──────────────────────────────
      const prev = prevBallState.current
      const currBall = nextState.ball

      // 1. Удар игрока по мячу
      if (nextState.lastHitBy === 'player' && prev.lastHitBy !== 'player') {
        const isSmash = Boolean(currBall.isSmash)
        soundManager.playPaddleHit(isSmash)
        if (isSmash) {
          shakeRef.current.power = 7
          spawnHitSparks(currBall.x, currBall.y, currBall.z, '#60a5fa', 16)
        } else {
          shakeRef.current.power = 2
          spawnHitSparks(currBall.x, currBall.y, currBall.z, '#ffffff', 8)
        }
        onStateChange(nextState, isSmash)
      }

      // 2. Удар соперника по мячу
      if (nextState.lastHitBy === 'opponent' && prev.lastHitBy !== 'opponent') {
        soundManager.playPaddleHit(false)
        spawnHitSparks(currBall.x, currBall.y, currBall.z, '#f87171', 8)
        onStateChange(nextState, false)
      }

      // 3. Отскок мяча от стола
      const bouncedPlayer = currBall.bouncesPlayer > prev.bouncesPlayer
      const bouncedOpponent = currBall.bouncesOpponent > prev.bouncesOpponent
      if (bouncedPlayer || bouncedOpponent) {
        soundManager.playTableBounce()
        spawnTableSparks(currBall.x, 0, currBall.z, 10)
      }

      // 4. Попадание в сетку
      if (nextState.faultReason === 'net' && prev.phase !== 'pointEnd') {
        soundManager.playNetHit()
      }

      // 5. Окончание розыгрыша очка
      if (nextState.pointWinner && !prev.pointWinner) {
        if (nextState.pointWinner === 'player') {
          soundManager.playVictory()
        } else {
          soundManager.playGameOver()
        }
        onStateChange(nextState, false)
      }

      // 6. Окончание матча (сохранение рекорда)
      if (nextState.matchOver && !recordedMatchRef.current) {
        recordedMatchRef.current = true
        saveGameRecord({
          gameId: 'pong',
          difficulty: nextState.difficulty,
          timeSeconds: Math.round(nextState.elapsedMs / 1000),
          score: tennisEngine.getScore(nextState),
          won: nextState.matchWinner === 'player',
        })
        onStateChange(nextState, false)
      }

      // Сохраняем предыдущие значения
      prev.bouncesPlayer = currBall.bouncesPlayer
      prev.bouncesOpponent = currBall.bouncesOpponent
      prev.lastHitBy = nextState.lastHitBy
      prev.phase = nextState.phase
      prev.pointWinner = nextState.pointWinner

      // ── ОБНОВЛЕНИЕ ТРЕЙЛА И ЧАСТИЦ ──────────────────────────────────────────
      const speed = Math.sqrt(currBall.vx ** 2 + currBall.vy ** 2 + currBall.vz ** 2)
      if (speed > 240 && nextState.phase === 'rally') {
        trailRef.current.push({ x: currBall.x, y: currBall.y, z: currBall.z, alpha: 0.7 })
        if (trailRef.current.length > 9) trailRef.current.shift()
      } else if (trailRef.current.length > 0) {
        trailRef.current.shift()
      }
      trailRef.current.forEach((t) => (t.alpha -= 0.08))

      // Частицы
      particlesRef.current.forEach((p) => {
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.z += p.vz * dt
        p.vy -= 400 * dt // гравитация частиц
        p.alpha -= 1.8 * dt
      })
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.02)

      // Screen shake
      const shake = shakeRef.current
      shake.power *= 0.84
      shake.x = (Math.random() - 0.5) * shake.power * 2.5
      shake.y = (Math.random() - 0.5) * shake.power * 2.5

      // ── РЕНДЕРИНГ КАДРА В 3D ───────────────────────────────────────────────
      render3DScene(ctx, canvas, nextState, shake)
    }

    animId = requestAnimationFrame(renderLoop)
    return () => cancelAnimationFrame(animId)
  }, [stateRef, inputRef, onStateChange])

  // Спавн искр при ударе
  function spawnHitSparks(x: number, y: number, z: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const spd = 40 + Math.random() * 120
      particlesRef.current.push({
        x,
        y,
        z,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd + 30,
        vz: (Math.random() - 0.5) * 60,
        alpha: 0.9,
        color,
        size: 2 + Math.random() * 2.5,
      })
    }
  }

  // Спавн пыли/искр при отскоке от стола
  function spawnTableSparks(x: number, y: number, z: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const spd = 20 + Math.random() * 50
      particlesRef.current.push({
        x,
        y: y + 1,
        z,
        vx: Math.cos(angle) * spd,
        vy: 20 + Math.random() * 40,
        vz: Math.sin(angle) * spd,
        alpha: 0.75,
        color: '#ffffff',
        size: 1.5 + Math.random() * 2,
      })
    }
  }

  // ── РЕНДЕР 3D СЦЕНЫ ────────────────────────────────────────────────────────
  function render3DScene(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: TennisState,
    shake: { x: number; y: number }
  ) {
    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width = W * dpr
      canvas.height = H * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.translate(shake.x, shake.y)

    // 1. Фон арены / спортзала
    drawArenaBackground(ctx, W, H)

    // 2. 3D Стол для настольного тенниса
    drawTable3D(ctx, W, H)

    // 3. 3D Сетка с текстурой
    drawNet3D(ctx, W, H)

    // 4. Ракетка соперника (вдали)
    drawOpponentPaddle3D(ctx, W, H, state.opponent)

    // 5. Тень мяча на столе (критично для восприятия высоты и глубины!)
    drawBallShadow3D(ctx, W, H, state.ball)

    // 6. Трейл мяча
    drawBallTrail3D(ctx, W, H)

    // 7. Мяч в 3D
    drawBall3D(ctx, W, H, state.ball)

    // 8. Частицы
    drawParticles3D(ctx, W, H)

    // 9. Ракетка игрока от первого лица (на переднем плане)
    drawPlayerPaddle3D(ctx, W, H, state.player)

    ctx.restore()
  }

  // ── Отрисовка арены ────────────────────────────────────────────────────────
  function drawArenaBackground(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // Темно-синий градиент софитов спортивной арены
    const bgGrad = ctx.createRadialGradient(W / 2, H * 0.35, 20, W / 2, H * 0.5, W * 0.8)
    bgGrad.addColorStop(0, '#1a273a')
    bgGrad.addColorStop(0.5, '#0f1724')
    bgGrad.addColorStop(1, '#080d14')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, W, H)

    // Пол зала (темный паркет под столом)
    const floorGrad = ctx.createLinearGradient(0, H * 0.55, 0, H)
    floorGrad.addColorStop(0, 'rgba(18, 24, 38, 0.4)')
    floorGrad.addColorStop(1, 'rgba(10, 14, 22, 0.95)')
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, H * 0.55, W, H * 0.45)
  }

  // ── Отрисовка стола в 3D ───────────────────────────────────────────────────
  function drawTable3D(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const halfW = TABLE_WIDTH / 2
    const len = TABLE_LENGTH

    // 4 угла поверхности стола (y = 0)
    const pNearLeft = project3D(-halfW, 0, 0, W, H)
    const pNearRight = project3D(halfW, 0, 0, W, H)
    const pFarRight = project3D(halfW, 0, len, W, H)
    const pFarLeft = project3D(-halfW, 0, len, W, H)

    // Точки для толщины столешницы (боковина y = -4)
    const thickness = -5
    const pNearLeftBot = project3D(-halfW, thickness, 0, W, H)
    const pNearRightBot = project3D(halfW, thickness, 0, W, H)
    const pFarLeftBot = project3D(-halfW, thickness, len, W, H)
    const pFarRightBot = project3D(halfW, thickness, len, W, H)

    // 1. Ножки стола
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 4
    // Передние ножки
    const pFloorNL = project3D(-halfW + 10, -50, 20, W, H)
    const pFloorNR = project3D(halfW - 10, -50, 20, W, H)
    ctx.beginPath()
    ctx.moveTo(pNearLeftBot.x + 10, pNearLeftBot.y)
    ctx.lineTo(pFloorNL.x, pFloorNL.y)
    ctx.moveTo(pNearRightBot.x - 10, pNearRightBot.y)
    ctx.lineTo(pFloorNR.x, pFloorNR.y)
    ctx.stroke()

    // 2. Передний торец столешницы
    ctx.fillStyle = '#0a2540'
    ctx.beginPath()
    ctx.moveTo(pNearLeft.x, pNearLeft.y)
    ctx.lineTo(pNearRight.x, pNearRight.y)
    ctx.lineTo(pNearRightBot.x, pNearRightBot.y)
    ctx.lineTo(pNearLeftBot.x, pNearLeftBot.y)
    ctx.closePath()
    ctx.fill()

    // 3. Боковые торцы столешницы
    ctx.fillStyle = '#071d33'
    ctx.beginPath()
    ctx.moveTo(pNearLeft.x, pNearLeft.y)
    ctx.lineTo(pFarLeft.x, pFarLeft.y)
    ctx.lineTo(pFarLeftBot.x, pFarLeftBot.y)
    ctx.lineTo(pNearLeftBot.x, pNearLeftBot.y)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(pNearRight.x, pNearRight.y)
    ctx.lineTo(pFarRight.x, pFarRight.y)
    ctx.lineTo(pFarRightBot.x, pFarRightBot.y)
    ctx.lineTo(pNearRightBot.x, pNearRightBot.y)
    ctx.closePath()
    ctx.fill()

    // 4. Поверхность стола (красивый турнирный синий с градиентом глубины)
    const tableGrad = ctx.createLinearGradient(0, pFarLeft.y, 0, pNearLeft.y)
    tableGrad.addColorStop(0, '#103b6d')
    tableGrad.addColorStop(0.5, '#164e8e')
    tableGrad.addColorStop(1, '#1b5aa4')

    ctx.fillStyle = tableGrad
    ctx.beginPath()
    ctx.moveTo(pNearLeft.x, pNearLeft.y)
    ctx.lineTo(pNearRight.x, pNearRight.y)
    ctx.lineTo(pFarRight.x, pFarRight.y)
    ctx.lineTo(pFarLeft.x, pFarLeft.y)
    ctx.closePath()
    ctx.fill()

    // 5. Белые разграничительные линии стола
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'

    // Белая рамка вокруг стола
    ctx.beginPath()
    ctx.moveTo(pNearLeft.x, pNearLeft.y)
    ctx.lineTo(pNearRight.x, pNearRight.y)
    ctx.lineTo(pFarRight.x, pFarRight.y)
    ctx.lineTo(pFarLeft.x, pFarLeft.y)
    ctx.closePath()
    ctx.stroke()

    // Центральная белая продольная линия (для парной игры и ориентира)
    const pCenterNear = project3D(0, 0, 0, W, H)
    const pCenterFar = project3D(0, 0, len, W, H)
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(pCenterNear.x, pCenterNear.y)
    ctx.lineTo(pCenterFar.x, pCenterFar.y)
    ctx.stroke()
  }

  // ── Отрисовка сетки в 3D ───────────────────────────────────────────────────
  function drawNet3D(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const halfW = TABLE_WIDTH / 2
    const netExtension = 8 // сетка выступает по бокам

    const pNetBotLeft = project3D(-halfW - netExtension, 0, NET_Z, W, H)
    const pNetBotRight = project3D(halfW + netExtension, 0, NET_Z, W, H)
    const pNetTopLeft = project3D(-halfW - netExtension, NET_HEIGHT, NET_Z, W, H)
    const pNetTopRight = project3D(halfW + netExtension, NET_HEIGHT, NET_Z, W, H)

    // Ткань сетки (полупрозрачная текстура)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
    ctx.beginPath()
    ctx.moveTo(pNetBotLeft.x, pNetBotLeft.y)
    ctx.lineTo(pNetBotRight.x, pNetBotRight.y)
    ctx.lineTo(pNetTopRight.x, pNetTopRight.y)
    ctx.lineTo(pNetTopLeft.x, pNetTopLeft.y)
    ctx.closePath()
    ctx.fill()

    // Ячейки сетки (сетчатый рисунок)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
    ctx.lineWidth = 1
    const cols = 16
    for (let i = 1; i < cols; i++) {
      const u = i / cols
      const x0 = pNetBotLeft.x + (pNetBotRight.x - pNetBotLeft.x) * u
      const y0 = pNetBotLeft.y + (pNetBotRight.y - pNetBotLeft.y) * u
      const x1 = pNetTopLeft.x + (pNetTopRight.x - pNetTopLeft.x) * u
      const y1 = pNetTopLeft.y + (pNetTopRight.y - pNetTopLeft.y) * u
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }

    // Верхняя белая тесьма сетки
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(pNetTopLeft.x, pNetTopLeft.y)
    ctx.lineTo(pNetTopRight.x, pNetTopRight.y)
    ctx.stroke()

    // Металлические стойки сетки по бокам
    ctx.fillStyle = '#64748b'
    ctx.fillRect(pNetTopLeft.x - 2, pNetTopLeft.y, 4, pNetBotLeft.y - pNetTopLeft.y + 4)
    ctx.fillRect(pNetTopRight.x - 2, pNetTopRight.y, 4, pNetBotRight.y - pNetTopRight.y + 4)
  }

  // ── Тень мяча на столе в 3D ────────────────────────────────────────────────
  function drawBallShadow3D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    ball: TennisState['ball']
  ) {
    // Тень проецируется на поверхность стола (y = 0)
    const pShadow = project3D(ball.x, 0, ball.z, W, H)
    if (!pShadow.visible) return

    // Проверяем, находится ли мяч над столом
    const halfW = TABLE_WIDTH / 2
    if (Math.abs(ball.x) > halfW + 15 || ball.z < -10 || ball.z > TABLE_LENGTH + 20) {
      return
    }

    // Прозрачность и масштаб тени зависят от высоты мяча
    const heightClamped = Math.max(0, ball.y)
    const alpha = Math.max(0.12, 0.60 - heightClamped * 0.009)
    const radiusX = (BALL_RADIUS * 1.6 + heightClamped * 0.04) * pShadow.scale
    const radiusY = (BALL_RADIUS * 0.7 + heightClamped * 0.02) * pShadow.scale

    ctx.save()
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(2)})`
    ctx.beginPath()
    ctx.ellipse(pShadow.x, pShadow.y, radiusX, radiusY, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // ── Трейл мяча ─────────────────────────────────────────────────────────────
  function drawBallTrail3D(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const trail = trailRef.current
    trail.forEach((item, i) => {
      const p = project3D(item.x, item.y, item.z, W, H)
      if (!p.visible) return

      const r = BALL_RADIUS * p.scale * (0.6 + (i / trail.length) * 0.4)
      ctx.save()
      ctx.fillStyle = `rgba(254, 240, 138, ${(item.alpha * 0.35).toFixed(2)})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  // ── Отрисовка 3D мяча ──────────────────────────────────────────────────────
  function drawBall3D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    ball: TennisState['ball']
  ) {
    const p = project3D(ball.x, ball.y, ball.z, W, H)
    if (!p.visible) return

    const r = Math.max(3, BALL_RADIUS * p.scale)

    ctx.save()

    // Свечение при смэше
    if (ball.isSmash) {
      ctx.shadowColor = '#60a5fa'
      ctx.shadowBlur = 14 * p.scale
    } else {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'
      ctx.shadowBlur = 4 * p.scale
    }

    // 3D сферический градиент (бело-оранжевый шарик для пинг-понга с бликом)
    const ballGrad = ctx.createRadialGradient(
      p.x - r * 0.35,
      p.y - r * 0.35,
      r * 0.1,
      p.x,
      p.y,
      r
    )
    ballGrad.addColorStop(0, '#ffffff')
    ballGrad.addColorStop(0.3, '#fff4e5')
    ballGrad.addColorStop(0.8, '#ffb86c')
    ballGrad.addColorStop(1, '#e08320')

    ctx.fillStyle = ballGrad
    ctx.beginPath()
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fill()

    // Четкий верхний блик света
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.beginPath()
    ctx.arc(p.x - r * 0.35, p.y - r * 0.35, r * 0.28, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // ── Ракетка соперника в 3D ─────────────────────────────────────────────────
  function drawOpponentPaddle3D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    opponent: TennisState['opponent']
  ) {
    const p = project3D(opponent.x, opponent.y, opponent.z, W, H)
    if (!p.visible) return

    const rx = PADDLE_RADIUS_X * p.scale
    const ry = PADDLE_RADIUS_Y * p.scale

    ctx.save()

    // Тень ракетки бота
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 8

    // Деревянная ручка ракетки
    ctx.fillStyle = '#b45309'
    ctx.fillRect(p.x - rx * 0.15, p.y + ry * 0.8, rx * 0.3, ry * 0.9)

    // Красная резина ракетки
    const padGrad = ctx.createRadialGradient(p.x, p.y, rx * 0.2, p.x, p.y, rx)
    padGrad.addColorStop(0, opponent.isHitting ? '#f87171' : '#dc2626')
    padGrad.addColorStop(1, '#991b1b')

    ctx.fillStyle = padGrad
    ctx.beginPath()
    ctx.ellipse(p.x, p.y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()

    // Деревянный обод ракетки
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = Math.max(1, 2 * p.scale)
    ctx.stroke()

    ctx.restore()
  }

  // ── Ракетка игрока от первого лица (передний план) ─────────────────────────
  function drawPlayerPaddle3D(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    player: TennisState['player']
  ) {
    const p = project3D(player.x, player.y, player.z, W, H)
    if (!p.visible) return

    // Squash & Stretch в момент контакта
    const squashFactor = player.isHitting ? 1.15 : 1.0
    const rx = PADDLE_RADIUS_X * p.scale * squashFactor
    const ry = PADDLE_RADIUS_Y * p.scale * (2.0 - squashFactor)

    ctx.save()
    ctx.translate(p.x, p.y)

    // Динамический наклон ракетки в направлении движения мыши
    ctx.rotate(player.tiltX)

    // Мягкая тень под ракеткой игрока
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'
    ctx.shadowBlur = 18

    // 1. Деревянная рукоятка (направлена вниз-вправо, как держат ракетку)
    const handleW = rx * 0.32
    const handleH = ry * 1.3
    const handleGrad = ctx.createLinearGradient(0, ry * 0.7, 0, ry * 0.7 + handleH)
    handleGrad.addColorStop(0, '#d97706')
    handleGrad.addColorStop(0.5, '#b45309')
    handleGrad.addColorStop(1, '#78350f')

    ctx.fillStyle = handleGrad
    ctx.beginPath()
    ctx.roundRect(-handleW / 2, ry * 0.7, handleW, handleH, 5)
    ctx.fill()

    // Декоративная вставка на ручке
    ctx.fillStyle = '#fef3c7'
    ctx.fillRect(-handleW * 0.25, ry * 0.9, handleW * 0.5, handleH * 0.6)

    // 2. Деревянный обод лопасти
    ctx.fillStyle = '#fde68a'
    ctx.beginPath()
    ctx.ellipse(0, 0, rx + 2.5, ry + 2.5, 0, 0, Math.PI * 2)
    ctx.fill()

    // 3. Черная или красная резина ракетки (у игрока стильная матовая черная резина)
    const rubberGrad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, rx * 0.15, 0, 0, rx)
    if (player.isHitting) {
      rubberGrad.addColorStop(0, '#475569')
      rubberGrad.addColorStop(1, '#0f172a')
    } else {
      rubberGrad.addColorStop(0, '#334155')
      rubberGrad.addColorStop(0.7, '#1e293b')
      rubberGrad.addColorStop(1, '#0f172a')
    }

    ctx.fillStyle = rubberGrad
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()

    // 4. Текстурный логотип / пупырышки резины
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(0, 0, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2)
    ctx.stroke()

    // 5. Блик света на резине
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.beginPath()
    ctx.ellipse(-rx * 0.3, -ry * 0.3, rx * 0.35, ry * 0.25, -0.4, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // ── Отрисовка частиц ───────────────────────────────────────────────────────
  function drawParticles3D(ctx: CanvasRenderingContext2D, W: number, H: number) {
    particlesRef.current.forEach((p) => {
      const proj = project3D(p.x, p.y, p.z, W, H)
      if (!proj.visible) return

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(proj.x, proj.y, Math.max(1, p.size * proj.scale), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ touchAction: 'none', cursor: 'none' }}
    />
  )
})
