'use client'

// Холст отрисовки игры Змейка с плавной графикой и адаптивным разрешением

import { useEffect, useRef, memo } from 'react'
import type { SnakeState, Direction } from '@/games/snake/types'

interface SnakeCanvasProps {
  state: SnakeState
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export const SnakeCanvas = memo(function SnakeCanvas({
  state,
  onTouchStart,
  onTouchEnd,
}: SnakeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvas.clientWidth
    const displayHeight = canvas.clientHeight

    if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)

    const size = state.gridSize
    const cellSize = displayWidth / size

    // Очистка фона
    ctx.fillStyle = '#0f172a' // темный slate фон
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    // Тонкая фоновая сетка
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= size; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, displayHeight)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(displayWidth, i * cellSize)
      ctx.stroke()
    }

    // Отрисовка еды
    const food = state.food
    const foodX = food.x * cellSize + cellSize / 2
    const foodY = food.y * cellSize + cellSize / 2
    const foodRadius = cellSize * 0.42

    ctx.save()
    if (state.foodType === 'golden') {
      // Золотое яблоко
      ctx.shadowColor = '#eab308'
      ctx.shadowBlur = 12
      ctx.fillStyle = '#eab308'
      ctx.beginPath()
      ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2)
      ctx.fill()

      // Блик
      ctx.fillStyle = '#fef08a'
      ctx.beginPath()
      ctx.arc(foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, foodRadius * 0.3, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Обычное красное яблоко
      ctx.shadowColor = '#ef4444'
      ctx.shadowBlur = 6
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2)
      ctx.fill()

      // Черешок яблока
      ctx.strokeStyle = '#15803d'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(foodX, foodY - foodRadius)
      ctx.quadraticCurveTo(foodX + 3, foodY - foodRadius - 4, foodX + 6, foodY - foodRadius - 2)
      ctx.stroke()
    }
    ctx.restore()

    // Отрисовка тела змейки
    const snake = state.snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const segment = snake[i]
      const segX = segment.x * cellSize
      const segY = segment.y * cellSize
      const isHead = i === 0

      ctx.save()
      if (isHead) {
        // Голова змейки
        ctx.fillStyle = '#22c55e'
        const radius = cellSize * 0.25
        ctx.beginPath()
        ctx.roundRect(segX + 1.5, segY + 1.5, cellSize - 3, cellSize - 3, radius)
        ctx.fill()

        // Глазки в направлении движения
        drawSnakeEyes(ctx, segX, segY, cellSize, state.direction)
      } else {
        // Тело: градиент от зеленого к изумрудному
        const progress = i / snake.length
        ctx.fillStyle = progress < 0.5 ? '#16a34a' : '#15803d'
        const radius = cellSize * 0.2
        ctx.beginPath()
        ctx.roundRect(segX + 2, segY + 2, cellSize - 4, cellSize - 4, radius)
        ctx.fill()
      }
      ctx.restore()
    }

    ctx.restore()
  }, [state])

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'none' }}
      className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden border-2 border-border shadow-md select-none"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
})

function drawSnakeEyes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  direction: Direction
) {
  const eyeRadius = size * 0.12
  const pupilRadius = size * 0.06

  let eye1 = { x: 0, y: 0 }
  let eye2 = { x: 0, y: 0 }
  let pupilOffset = { x: 0, y: 0 }

  switch (direction) {
    case 'UP':
      eye1 = { x: x + size * 0.28, y: y + size * 0.28 }
      eye2 = { x: x + size * 0.72, y: y + size * 0.28 }
      pupilOffset = { x: 0, y: -pupilRadius * 0.6 }
      break
    case 'DOWN':
      eye1 = { x: x + size * 0.28, y: y + size * 0.72 }
      eye2 = { x: x + size * 0.72, y: y + size * 0.72 }
      pupilOffset = { x: 0, y: pupilRadius * 0.6 }
      break
    case 'LEFT':
      eye1 = { x: x + size * 0.28, y: y + size * 0.28 }
      eye2 = { x: x + size * 0.28, y: y + size * 0.72 }
      pupilOffset = { x: -pupilRadius * 0.6, y: 0 }
      break
    case 'RIGHT':
      eye1 = { x: x + size * 0.72, y: y + size * 0.28 }
      eye2 = { x: x + size * 0.72, y: y + size * 0.72 }
      pupilOffset = { x: pupilRadius * 0.6, y: 0 }
      break
  }

  // Белки глаз
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(eye1.x, eye1.y, eyeRadius, 0, Math.PI * 2)
  ctx.arc(eye2.x, eye2.y, eyeRadius, 0, Math.PI * 2)
  ctx.fill()

  // Зрачки
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(eye1.x + pupilOffset.x, eye1.y + pupilOffset.y, pupilRadius, 0, Math.PI * 2)
  ctx.arc(eye2.x + pupilOffset.x, eye2.y + pupilOffset.y, pupilRadius, 0, Math.PI * 2)
  ctx.fill()
}