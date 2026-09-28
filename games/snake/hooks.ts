'use client'

// React-хук для игры Змейка: игровой цикл, буферизация ввода и управление

import { useState, useCallback, useEffect, useRef } from 'react'
import { snakeEngine, isOppositeDirection } from './engine'
import type { SnakeState, Direction, Difficulty } from './types'
import { SNAKE_DIFFICULTY_CONFIG } from './types'
import { getSnakeBestScore, saveSnakeBestScore } from '@/lib/storage/snakeSession'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'

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
  const stateRef = useRef(state)
  stateRef.current = state
  const recordedRef = useRef(false)

  const changeDirection = useCallback((dir: Direction) => {
    const curr = stateRef.current
    const lastDir =
      inputQueueRef.current.length > 0
        ? inputQueueRef.current[inputQueueRef.current.length - 1]
        : curr.direction

    if (!isOppositeDirection(lastDir, dir) && lastDir !== dir) {
      if (inputQueueRef.current.length < 2) {
        inputQueueRef.current.push(dir)
      }
    }
  }, [])

  const restart = useCallback(() => {
    recordedRef.current = false
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
    recordedRef.current = false
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

  // Сохранение рекорда при окончании игры
  useEffect(() => {
    if (state.isOver && !recordedRef.current) {
      recordedRef.current = true
      saveGameRecord({
        gameId: 'snake',
        difficulty: state.difficulty,
        score: state.score,
        timeSeconds: state.score, // число очков
        won: false,
      })
    }
  }, [state.isOver, state.difficulty, state.score])

  // Игровой цикл тиков
  useEffect(() => {
    if (state.isOver || state.isPaused) return

    const speed = SNAKE_DIFFICULTY_CONFIG[state.difficulty].speedMs

    const interval = setInterval(() => {
      const current = stateRef.current
      if (current.isOver || current.isPaused) return

      let prepared = current
      // Достаем следующее направление из буфера ввода
      if (inputQueueRef.current.length > 0) {
        const nextDir = inputQueueRef.current.shift()!
        prepared = snakeEngine.applyAction(prepared, {
          type: 'setDirection',
          direction: nextDir,
        })
      }

      const next = snakeEngine.applyAction(prepared, { type: 'tick' })

      // Звуковые эффекты снаружи setState
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

      setState(next)
    }, speed)

    return () => clearInterval(interval)
  }, [state.difficulty, state.isOver, state.isPaused])

  // Клавиатурное управление
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Игнорируем системные комбинации (Ctrl+S, Ctrl+W, Cmd+...)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      // Не перехватываем ввод в текстовых полях
      if (e.target instanceof HTMLElement) {
        if (e.target.isContentEditable || e.target.closest('input, textarea')) {
          return
        }
        // Если фокус на кнопке, пробел должен нажимать кнопку
        if (e.target.closest('button') && (e.key === ' ' || e.code === 'Space')) {
          return
        }
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