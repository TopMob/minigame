'use client'

// React-хук для игры 2048 — управление состоянием, ходами, историей (undo) и таймером

import { useState, useCallback, useEffect, useRef } from 'react'
import { game2048Engine } from './engine'
import type { Game2048State, Direction } from './types'
import {
  load2048Session,
  save2048Session,
  clear2048Session,
  get2048BestScore,
  save2048BestScore,
} from '@/lib/storage/game2048Session'
import { saveGameRecord } from '@/lib/storage/records'

export interface Use2048Return {
  state: Game2048State
  timeElapsed: number
  move: (direction: Direction) => void
  restart: () => void
  undo: () => void
  canUndo: boolean
  keepPlaying: () => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

export function use2048(): Use2048Return {
  const [session] = useState(() => load2048Session())
  const [state, setState] = useState<Game2048State>(() => {
    if (session) {
      return session.state
    }
    const initial = game2048Engine.createInitialState({})
    initial.bestScore = get2048BestScore()
    return initial
  })

  const [timeElapsed, setTimeElapsed] = useState(() => session?.timeElapsed ?? 0)
  const [history, setHistory] = useState<Game2048State[]>([])
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const recordedRef = useRef(false)

  // Таймер партии
  useEffect(() => {
    if (state.isOver) return

    const interval = setInterval(() => {
      setTimeElapsed((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isOver])

  // Сохранение сессии и рекорда
  useEffect(() => {
    if (state.isOver) {
      clear2048Session()
      if (!recordedRef.current) {
        recordedRef.current = true
        saveGameRecord({
          gameId: '2048',
          difficulty: 'medium',
          score: state.score,
          timeSeconds: timeElapsed,
          won: state.isWon,
        })
      }
    } else {
      save2048Session(state, timeElapsed)
    }

    if (state.score > 0) {
      save2048BestScore(state.bestScore)
    }
  }, [state, timeElapsed])

  const move = useCallback((direction: Direction) => {
    const prev = stateRef.current
    if (prev.isOver) return
    const next = game2048Engine.applyAction(prev, { type: 'move', direction })
    if (next !== prev) {
      setHistory((h) => [...h.slice(-10), prev])
      setState(next)
    }
  }, [])

  const restart = useCallback(() => {
    recordedRef.current = false
    clear2048Session()
    const fresh = game2048Engine.createInitialState({})
    fresh.bestScore = get2048BestScore()
    setState(fresh)
    setHistory([])
    setTimeElapsed(0)
  }, [])

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      const currentBest = stateRef.current.bestScore
      setState({
        ...prev,
        bestScore: Math.max(prev.bestScore, currentBest),
      })
      return h.slice(0, -1)
    })
  }, [])

  const keepPlaying = useCallback(() => {
    setState((prev) => game2048Engine.applyAction(prev, { type: 'keepPlaying' }))
  }, [])

  // Клавиатурное управление (Стрелки + WASD)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Не перехватываем системные комбинации клавиш (Ctrl+S, Ctrl+W, Cmd+...)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      // Игнорируем ввод, если фокус в инпуте
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      let direction: Direction | null = null

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
        case 'ц':
        case 'Ц':
          direction = 'up'
          break
        case 'ArrowDown':
        case 's':
        case 'S':
        case 'ы':
        case 'Ы':
          direction = 'down'
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
        case 'ф':
        case 'Ф':
          direction = 'left'
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
        case 'в':
        case 'В':
          direction = 'right'
          break
      }

      if (direction) {
        e.preventDefault()
        move(direction)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [move])

  // Тач-свайпы для мобильных устройств
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
      const threshold = 30 // минимальное расстояние для регистрации свайпа

      if (Math.max(absX, absY) < threshold) return

      if (absX > absY) {
        move(deltaX > 0 ? 'right' : 'left')
      } else {
        move(deltaY > 0 ? 'down' : 'up')
      }
    },
    [move]
  )

  return {
    state,
    timeElapsed,
    move,
    restart,
    undo,
    canUndo: history.length > 0,
    keepPlaying,
    onTouchStart,
    onTouchEnd,
  }
}
