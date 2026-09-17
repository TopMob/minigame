'use client'

// React-хук для игры Змейка: игровой цикл, буферизация ввода и управление

import { useState, useCallback, useEffect, useRef } from 'react'
import { snakeEngine, isOppositeDirection } from './engine'
import type { SnakeState, Direction, Difficulty } from './types'
import { SNAKE_DIFFICULTY_CONFIG } from './types'
import { getSnakeBestScore, saveSnakeBestScore } from '@/lib/storage/snakeSession'
import { soundManager } from '@/lib/audio/sounds'

export interface UseSnakeReturn {
  state: SnakeState
  changeDirection: (dir: Direction) => void
  restart: () => void
  togglePause: () => void
  setDifficulty: (diff: Difficulty) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export function useSnake(initialDifficulty: Difficulty = 'medium'): UseSnakeReturn {
  const [state, setState] = useState<SnakeState>(() => {
    const initial = snakeEngine.createInitialState({ difficulty: initialDifficulty })
    initial.bestScore = getSnakeBestScore(initialDifficulty)
    return initial
  })

  const inputQueueRef = useRef<Direction[]>([])
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const changeDirection = useCallback((dir: Direction) => {
    setState((curr) => {
      const lastDir =
        inputQueueRef.current.length > 0
          ? inputQueueRef.current[inputQueueRef.current.length - 1]
          : curr.direction

      if (!isOppositeDirection(lastDir, dir) && lastDir !== dir) {
        if (inputQueueRef.current.length < 2) {
          inputQueueRef.current.push(dir)
        }
      }
      return curr
    })
  }, [])

  const restart = useCallback(() => {
    inputQueueRef.current = []
    setState((prev) => {
      const fresh = snakeEngine.createInitialState({
        difficulty: prev.difficulty,
        gridSize: prev.gridSize,
      })
      fresh.bestScore = getSnakeBestScore(prev.difficulty)
      return fresh
    })
  }, [])

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (prev.isOver) return prev
      return prev.isPaused
        ? snakeEngine.applyAction(prev, { type: 'resume' })
        : snakeEngine.applyAction(prev, { type: 'pause' })
    })
  }, [])

  const setDifficulty = useCallback((diff: Difficulty) => {
    inputQueueRef.current = []
    setState((prev) => {
      const fresh = snakeEngine.createInitialState({
        difficulty: diff,
        gridSize: prev.gridSize,
      })
      fresh.bestScore = getSnakeBestScore(diff)
      return fresh
    })
  }, [])

  // Игровой цикл тиков
  useEffect(() => {
    if (state.isOver || state.isPaused) return

    const speed = SNAKE_DIFFICULTY_CONFIG[state.difficulty].speedMs

    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.isOver || prev.isPaused) return prev

        let current = prev
        // Достаем следующее направление из буфера ввода
        if (inputQueueRef.current.length > 0) {
          const nextDir = inputQueueRef.current.shift()!
          current = snakeEngine.applyAction(current, {
            type: 'setDirection',
            direction: nextDir,
          })
        }

        const next = snakeEngine.applyAction(current, { type: 'tick' })

        // Звуковые эффекты
        if (next.isOver && !current.isOver) {
          soundManager.playGameOver()
        } else if (next.score > current.score) {
          if (current.foodType === 'golden') {
            soundManager.playBonus()
          } else {
            soundManager.playEat()
          }
        }

        if (next.score > 0) {
          saveSnakeBestScore(next.difficulty, next.bestScore)
        }

        return next
      })
    }, speed)

    return () => clearInterval(interval)
  }, [state.difficulty, state.isOver, state.isPaused])

  // Клавиатурное управление
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'ц':
        case 'Ц':
          e.preventDefault()
          changeDirection('UP')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
        case 'ы':
        case 'Ы':
          e.preventDefault()
          changeDirection('DOWN')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'ф':
        case 'Ф':
          e.preventDefault()
          changeDirection('LEFT')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
        case 'в':
        case 'В':
          e.preventDefault()
          changeDirection('RIGHT')
          break
        case ' ':
        case 'p':
        case 'P':
        case 'з':
        case 'З':
          e.preventDefault()
          togglePause()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [changeDirection, togglePause])

  // Свайпы для мобильных устройств
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length === 0) return

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
      touchStartRef.current = null

      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      const threshold = 25

      if (Math.max(absX, absY) < threshold) return

      if (absX > absY) {
        changeDirection(deltaX > 0 ? 'RIGHT' : 'LEFT')
      } else {
        changeDirection(deltaY > 0 ? 'DOWN' : 'UP')
      }
    },
    [changeDirection]
  )

  return {
    state,
    changeDirection,
    restart,
    togglePause,
    setDifficulty,
    onTouchStart,
    onTouchEnd,
  }
}