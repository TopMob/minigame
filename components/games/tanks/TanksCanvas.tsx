'use client'

// Холст отрисовки Танчиков с 60 FPS requestAnimationFrame циклом,
// насыщенной нео-ретро графикой, эффектами частиц, следами гусениц и шейком экрана

import { useEffect, useRef, memo } from 'react'
import {
  TanksState,
  TileType,
  GRID_SIZE,
  TILE_SIZE,
  MAP_SIZE,
  TANK_SIZE,
  BULLET_SIZE,
  Tank,
  Direction,
} from '@/games/tanks/types'

interface TanksCanvasProps {
  stateRef: React.MutableRefObject<TanksState>
}

export const TanksCanvas = memo(function TanksCanvas({ stateRef }: TanksCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let animId: number

    const render = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const state = stateRef.current

      // Высокое разрешение для Retina/High-DPI
      const dpr = window.devicePixelRatio || 1
      const displayWidth = canvas.clientWidth
      const displayHeight = canvas.clientHeight

      if (
        canvas.width !== Math.round(displayWidth * dpr) ||
        canvas.height !== Math.round(displayHeight * dpr)
      ) {
        canvas.width = Math.round(displayWidth * dpr)
        canvas.height = Math.round(displayHeight * dpr)
      }

      ctx.save()
      ctx.scale(dpr, dpr)

      // Масштабирование логического поля 416x416 под размер canvas
      const scale = displayWidth / MAP_SIZE

      ctx.save()
      ctx.scale(scale, scale)

      // Эффект тряски экрана при взрывах
      if (state.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * state.screenShake
        const shakeY = (Math.random() - 0.5) * state.screenShake
        ctx.translate(shakeX, shakeY)
      }

      // 1. Отрисовка фона (темная военная арена)
      ctx.fillStyle = '#090d16'
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE)

      // Тонкая координатная сетка швов бронеплит
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)'
      ctx.lineWidth = 1
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath()
        ctx.moveTo(i * TILE_SIZE, 0)
        ctx.lineTo(i * TILE_SIZE, MAP_SIZE)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, i * TILE_SIZE)
        ctx.lineTo(MAP_SIZE, i * TILE_SIZE)
        ctx.stroke()
      }

      // 2. Следы гусениц на земле
      for (const tm of state.trackMarks) {
        ctx.save()
        ctx.globalAlpha = tm.alpha
        ctx.fillStyle = '#030712'
        if (tm.dir === 'up' || tm.dir === 'down') {
          ctx.fillRect(tm.x, tm.y, 4, 10)
          ctx.fillRect(tm.x + 18, tm.y, 4, 10)
        } else {
          ctx.fillRect(tm.x, tm.y, 10, 4)
          ctx.fillRect(tm.x, tm.y + 18, 10, 4)
        }
        ctx.restore()
      }

      // 3. Отрисовка тайлов карты (кроме леса, лес рисуется поверх танков)
      const now = Date.now() / 300

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const tile = state.grid[r][c]
          const tx = c * TILE_SIZE
          const ty = r * TILE_SIZE

          if (tile === TileType.BRICK) {
            // Кирпичный блок с 3D фаской и раствором
            ctx.fillStyle = '#b45309'
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)

            // Блики на кирпичах
            ctx.fillStyle = '#d97706'
            ctx.fillRect(tx, ty, TILE_SIZE - 1, 2)
            ctx.fillRect(tx, ty + 8, TILE_SIZE - 1, 2)

            // Тени
            ctx.fillStyle = '#78350f'
            ctx.fillRect(tx + 1, ty + 6, TILE_SIZE - 2, 2)
            ctx.fillRect(tx + 1, ty + 14, TILE_SIZE - 2, 2)

            // Вертикальные швы
            ctx.fillStyle = '#451a03'
            ctx.fillRect(tx + 7, ty, 1, 8)
            ctx.fillRect(tx + 3, ty + 8, 1, 8)
            ctx.fillRect(tx + 11, ty + 8, 1, 8)
          } else if (tile === TileType.STEEL) {
            // Стальной бронеблок
            ctx.fillStyle = '#64748b'
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)

            // Светлый скос сверху-слева
            ctx.fillStyle = '#cbd5e1'
            ctx.fillRect(tx, ty, TILE_SIZE, 1)
            ctx.fillRect(tx, ty, 1, TILE_SIZE)

            // Темный скос снизу-справа
            ctx.fillStyle = '#334155'
            ctx.fillRect(tx, ty + TILE_SIZE - 1, TILE_SIZE, 1)
            ctx.fillRect(tx + TILE_SIZE - 1, ty, 1, TILE_SIZE)

            // Заклепки по углам
            ctx.fillStyle = '#e2e8f0'
            ctx.fillRect(tx + 3, ty + 3, 2, 2)
            ctx.fillRect(tx + 11, ty + 3, 2, 2)
            ctx.fillRect(tx + 3, ty + 11, 2, 2)
            ctx.fillRect(tx + 11, ty + 11, 2, 2)
          } else if (tile === TileType.WATER) {
            // Водный канал с анимированной рябью
            ctx.fillStyle = '#0284c7'
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)

            // Анимированные блики волн
            const waveOffset = Math.sin(now + c * 0.4 + r * 0.3) * 2
            ctx.fillStyle = '#38bdf8'
            ctx.fillRect(tx + 2, ty + 4 + waveOffset, TILE_SIZE - 4, 1.5)
            ctx.fillRect(tx + 4, ty + 10 - waveOffset, TILE_SIZE - 8, 1.5)
          } else if (tile === TileType.ICE) {
            // Скользкий лед с легким свечением
            ctx.fillStyle = 'rgba(125, 211, 252, 0.25)'
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)

            ctx.strokeStyle = 'rgba(224, 242, 254, 0.4)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(tx + 2, ty + TILE_SIZE - 2)
            ctx.lineTo(tx + TILE_SIZE - 2, ty + 2)
            ctx.stroke()
          }
        }
      }

      // 4. Отрисовка штаба (Орел 32х32 внизу карты)
      const baseX = 12 * TILE_SIZE
      const baseY = 24 * TILE_SIZE

      if (!state.baseDestroyed) {
        // Живой золотой штаб-орел
        ctx.save()
        // Золотистый постамент
        ctx.fillStyle = '#334155'
        ctx.fillRect(baseX + 2, baseY + 20, 28, 10)
        ctx.fillStyle = '#475569'
        ctx.fillRect(baseX + 4, baseY + 22, 24, 6)

        // Золотой орел / герб
        const goldGrad = ctx.createLinearGradient(baseX, baseY, baseX + 32, baseY + 32)
        goldGrad.addColorStop(0, '#fef08a')
        goldGrad.addColorStop(0.5, '#eab308')
        goldGrad.addColorStop(1, '#ca8a04')

        ctx.fillStyle = goldGrad
        // Крылья
        ctx.beginPath()
        ctx.moveTo(baseX + 16, baseY + 2)
        ctx.lineTo(baseX + 2, baseY + 12)
        ctx.lineTo(baseX + 8, baseY + 22)
        ctx.lineTo(baseX + 16, baseY + 18)
        ctx.lineTo(baseX + 24, baseY + 22)
        ctx.lineTo(baseX + 30, baseY + 12)
        ctx.closePath()
        ctx.fill()

        // Голова орла и корона
        ctx.fillStyle = '#fef9c3'
        ctx.beginPath()
        ctx.arc(baseX + 16, baseY + 8, 4, 0, Math.PI * 2)
        ctx.fill()

        // Рубиновый глаз
        ctx.fillStyle = '#ef4444'
        ctx.fillRect(baseX + 17, baseY + 7, 2, 2)

        // Свечение штаба
        ctx.shadowColor = '#eab308'
        ctx.shadowBlur = 10
        ctx.strokeStyle = '#fef08a'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()
      } else {
        // Разрушенный штаб (руины и пепел)
        ctx.save()
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(baseX + 2, baseY + 8, 28, 22)
        // Трещины
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(baseX + 6, baseY + 10)
        ctx.lineTo(baseX + 16, baseY + 22)
        ctx.lineTo(baseX + 26, baseY + 12)
        ctx.stroke()
        ctx.restore()
      }

      // 5. Отрисовка бонусов
      for (const pow of state.powerups) {
        ctx.save()
        const pulse = Math.sin(now * 3) * 2
        const px = pow.x - pulse / 2
        const py = pow.y - pulse / 2
        const pSize = 26 + pulse

        // Неоновая подложка
        ctx.shadowColor = '#facc15'
        ctx.shadowBlur = 12
        ctx.fillStyle = '#1e1b4b'
        ctx.strokeStyle = '#facc15'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(px, py, pSize, pSize, 6)
        ctx.fill()
        ctx.stroke()

        // Значок бонуса
        ctx.shadowBlur = 0
        ctx.font = `${Math.floor(pSize * 0.6)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        let icon = '⭐'
        if (pow.type === 'shield') icon = '🛡️'
        else if (pow.type === 'bomb') icon = '💣'
        else if (pow.type === 'timer') icon = '⏱️'
        else if (pow.type === 'shovel') icon = '🧱'
        else if (pow.type === 'life') icon = '❤️'

        ctx.fillText(icon, px + pSize / 2, py + pSize / 2 + 1)
        ctx.restore()
      }

      // 6. Отрисовка вражеских танков
      for (const enemy of state.enemies) {
        renderTank(ctx, enemy, false, now)
      }

      // 7. Отрисовка танка игрока
      if (state.lives > 0 && !state.isGameOver) {
        renderTank(ctx, state.player, true, now)
      }

      // 8. Отрисовка леса (поверх танков с полупрозрачностью)
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (state.grid[r][c] === TileType.FOREST) {
            const tx = c * TILE_SIZE
            const ty = r * TILE_SIZE

            ctx.save()
            ctx.fillStyle = 'rgba(22, 101, 52, 0.88)' // насыщенная крона
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE)

            // Листья и фактура
            ctx.fillStyle = 'rgba(34, 197, 94, 0.6)'
            ctx.beginPath()
            ctx.arc(tx + 4, ty + 4, 3.5, 0, Math.PI * 2)
            ctx.arc(tx + 12, ty + 5, 3, 0, Math.PI * 2)
            ctx.arc(tx + 8, ty + 12, 4, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        }
      }

      // 9. Отрисовка снарядов
      for (const b of state.bullets) {
        ctx.save()
        // Огненное свечение пули
        ctx.shadowColor = b.owner === 'player' ? '#f59e0b' : '#ef4444'
        ctx.shadowBlur = 8
        ctx.fillStyle = b.owner === 'player' ? '#fef08a' : '#f87171'

        ctx.beginPath()
        ctx.arc(
          b.x + BULLET_SIZE / 2,
          b.y + BULLET_SIZE / 2,
          BULLET_SIZE / 2,
          0,
          Math.PI * 2
        )
        ctx.fill()

        // Белая горячая точка в центре
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(
          b.x + BULLET_SIZE / 2,
          b.y + BULLET_SIZE / 2,
          BULLET_SIZE / 4,
          0,
          Math.PI * 2
        )
        ctx.fill()
        ctx.restore()
      }

      // 10. Отрисовка частиц (взрывы, дым, искры)
      for (const pt of state.particles) {
        ctx.save()
        ctx.globalAlpha = Math.max(0, pt.alpha)

        if (pt.kind === 'shockwave') {
          ctx.strokeStyle = pt.color
          ctx.lineWidth = 3
          ctx.beginPath()
          const radius = pt.size * (1 - pt.life / pt.maxLife)
          ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2)
          ctx.stroke()
        } else if (pt.kind === 'fire' || pt.kind === 'spark') {
          ctx.fillStyle = pt.color
          ctx.shadowColor = pt.color
          ctx.shadowBlur = 6
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, pt.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (pt.kind === 'smoke') {
          ctx.fillStyle = pt.color
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
          ctx.fill()
        } else if (pt.kind === 'brick') {
          ctx.fillStyle = pt.color
          ctx.fillRect(pt.x, pt.y, pt.size, pt.size)
        }
        ctx.restore()
      }

      // 11. Отрисовка всплывающего текста очков и бонусов
      for (const ft of state.floatingTexts) {
        ctx.save()
        ctx.globalAlpha = Math.max(0, ft.alpha)
        ctx.fillStyle = ft.color
        ctx.shadowColor = '#000000'
        ctx.shadowBlur = 4
        ctx.font = 'bold 12px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(ft.text, ft.x + 14, ft.y)
        ctx.restore()
      }

      // 12. Виньетка по краям поля
      const vignette = ctx.createRadialGradient(
        MAP_SIZE / 2,
        MAP_SIZE / 2,
        MAP_SIZE * 0.45,
        MAP_SIZE / 2,
        MAP_SIZE / 2,
        MAP_SIZE * 0.72
      )
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE)

      ctx.restore() // unscale scale
      ctx.restore() // unscale dpr

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [stateRef])

  return (
    <div className="relative w-full aspect-square max-w-[440px] rounded-xl overflow-hidden border-2 border-border/80 shadow-2xl bg-[#090d16]">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
})

// Функция отрисовки отдельного танка со всеми элементами и поворотом
function renderTank(
  ctx: CanvasRenderingContext2D,
  tank: Tank,
  isPlayer: boolean,
  now: number
) {
  ctx.save()
  const cx = tank.x + TANK_SIZE / 2
  const cy = tank.y + TANK_SIZE / 2

  ctx.translate(cx, cy)

  // Поворот по направлению движения
  let angle = 0
  if (tank.dir === 'right') angle = Math.PI / 2
  else if (tank.dir === 'down') angle = Math.PI
  else if (tank.dir === 'left') angle = -Math.PI / 2
  ctx.rotate(angle)

  const half = TANK_SIZE / 2

  // Цветовая палитра танка
  let hullColor = '#10b981' // изумрудный для игрока
  let turretColor = '#059669'
  let accentColor = '#34d399'

  if (isPlayer) {
    if (tank.tier === 2) {
      hullColor = '#0284c7'
      turretColor = '#0369a1'
      accentColor = '#38bdf8'
    } else if (tank.tier === 3) {
      hullColor = '#7c3aed'
      turretColor = '#6d28d9'
      accentColor = '#c084fc'
    } else if (tank.tier === 4) {
      hullColor = '#d97706'
      turretColor = '#b45309'
      accentColor = '#fde047'
    }
  } else {
    // Вражеские танки
    if (tank.isFlashingBonus && Math.floor(now * 8) % 2 === 0) {
      hullColor = '#ef4444' // мигающий красный
      turretColor = '#dc2626'
      accentColor = '#fca5a5'
    } else if (tank.type === 'scout') {
      hullColor = '#eab308'
      turretColor = '#ca8a04'
      accentColor = '#fef08a'
    } else if (tank.type === 'light') {
      hullColor = '#06b6d4'
      turretColor = '#0891b2'
      accentColor = '#67e8f9'
    } else if (tank.type === 'assault') {
      hullColor = '#8b5cf6'
      turretColor = '#7c3aed'
      accentColor = '#c4b5fd'
    } else if (tank.type === 'heavy') {
      // Тяжелый танк меняет цвет при получении урона
      if (tank.hp === 3) {
        hullColor = '#475569'
        turretColor = '#334155'
        accentColor = '#94a3b8'
      } else if (tank.hp === 2) {
        hullColor = '#ea580c'
        turretColor = '#c2410c'
        accentColor = '#fdba74'
      } else {
        hullColor = '#dc2626'
        turretColor = '#991b1b'
        accentColor = '#fca5a5'
      }
    }
  }

  // 1. Гусеницы слева и справа
  ctx.fillStyle = '#1e293b'
  // Левая гусеница
  ctx.fillRect(-half, -half, 6, TANK_SIZE)
  // Правая гусеница
  ctx.fillRect(half - 6, -half, 6, TANK_SIZE)

  // Ребра траков гусениц (анимация движения)
  ctx.fillStyle = '#0f172a'
  const offset = (tank.trackTimer * 1.5) % 6
  for (let y = -half + offset; y < half; y += 6) {
    ctx.fillRect(-half, y, 6, 2)
    ctx.fillRect(half - 6, y, 6, 2)
  }

  // 2. Корпус танка (Hull)
  ctx.fillStyle = hullColor
  ctx.fillRect(-half + 5, -half + 2, TANK_SIZE - 10, TANK_SIZE - 4)

  // Скосы и блики корпуса
  ctx.fillStyle = accentColor
  ctx.fillRect(-half + 5, -half + 2, TANK_SIZE - 10, 2)

  // 3. Башня танка (Turret)
  ctx.fillStyle = turretColor
  ctx.beginPath()
  ctx.arc(0, 1, 6.5, 0, Math.PI * 2)
  ctx.fill()

  // Люк командира
  ctx.fillStyle = accentColor
  ctx.beginPath()
  ctx.arc(0, 1, 3, 0, Math.PI * 2)
  ctx.fill()

  // 4. Орудие (Пушка / Ствол)
  ctx.fillStyle = '#334155'
  const barrelLength = isPlayer && tank.tier >= 3 ? 15 : 12
  const barrelWidth = isPlayer && tank.tier >= 4 ? 4 : 3
  ctx.fillRect(-barrelWidth / 2, -half - (barrelLength - half) + 1, barrelWidth, barrelLength)

  // Дульный тормоз на конце пушки
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(-barrelWidth / 2 - 1, -half - (barrelLength - half) + 1, barrelWidth + 2, 2)

  // Звезды прокачки у игрока
  if (isPlayer && tank.tier > 1) {
    ctx.fillStyle = '#fde047'
    ctx.font = 'bold 7px sans-serif'
    ctx.textAlign = 'center'
    const stars = '★'.repeat(tank.tier - 1)
    ctx.fillText(stars, 0, 7)
  }

  // 5. Защитный силовой щит (аура неуязвимости)
  if (tank.shieldTimer > 0) {
    ctx.save()
    const shieldRadius = half + 4 + Math.sin(now * 8) * 1.5
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 2.5
    ctx.shadowColor = '#0284c7'
    ctx.shadowBlur = 10

    ctx.beginPath()
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2)
    ctx.stroke()

    // Внутреннее свечение поля
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'
    ctx.beginPath()
    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.restore()
}
