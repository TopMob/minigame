'use client'

// Хук интеграции движка тенниса с React:
// - rAF-цикл с правильным dt
// - буфер позиций мыши для расчёта скорости ракетки
// - управление фазами игры (serve, rally, pointEnd, gameEnd)
// - visibilitychange (не копим dt при возврате в вкладку)

import { useState, useCallback, useEffect, useRef } from 'react'
import { tennisEngine } from '@/games/tennis/engine'
import type { TennisState, TennisInput, TennisDifficulty } from '@/games/tennis/types'
import { saveGameRecord } from '@/lib/storage/records'
import { soundManager } from '@/lib/audio/sounds'

// Буфер последних N позиций мыши для расчёта скорости
const MOUSE_BUFFER_SIZE = 6

interface MouseSample {
  x: number
  y: number
  t: number
}

export interface UseTennisEngineReturn {
  state: TennisState
  containerRef: React.RefObject<HTMLDivElement | null>
  serve: () => void
  restart: () => void
  setDifficulty: (d: TennisDifficulty) => void
}

export function useTennisEngine(
  initialDifficulty: TennisDifficulty = 'medium'
): UseTennisEngineReturn {
  const [state, setState] = useState<TennisState>(() =>
    tennisEngine.createInitialState({ difficulty: initialDifficulty })
  )

  // Ref на div-контейнер корта (для расчёта нормализованных координат мыши)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Буфер последних позиций мыши
  const mouseBufferRef = useRef<MouseSample[]>([])
  // Текущий input для движка
  const inputRef = useRef<TennisInput>({ mouseX: 0.5, mouseY: 0.8, mouseVX: 0, mouseVY: 0 })

  // Флаг скрытия вкладки (для пропуска dt)
  const hiddenRef = useRef(false)
  // Время предыдущего кадра
  const lastTimeRef = useRef<number | null>(null)
  // rAF id
  const rafRef = useRef<number | null>(null)
  // Стейт в ref (чтобы избежать stale closure в rAF)
  const stateRef = useRef(state)
  stateRef.current = state

  // Сохранение рекорда (один раз за матч)
  const recordedRef = useRef(false)

  // ── Mousemove handler ──────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const now = performance.now()
    const buf = mouseBufferRef.current
    buf.push({ x, y, t: now })
    if (buf.length > MOUSE_BUFFER_SIZE) buf.shift()

    // Вычисляем скорость мыши из последних двух сэмплов (нормализованная, per sec)
    let vx = 0
    let vy = 0
    if (buf.length >= 2) {
      const a = buf[buf.length - 2]
      const b = buf[buf.length - 1]
      const dt = (b.t - a.t) / 1000
      if (dt > 0) {
        vx = (b.x - a.x) / dt
        vy = (b.y - a.y) / dt
      }
    }

    inputRef.current = { mouseX: x, mouseY: y, mouseVX: vx, mouseVY: vy }
  }, [])

  // Touch support (мобильные)
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container || e.touches.length === 0) return

    const rect = container.getBoundingClientRect()
    const touch = e.touches[0]
    const x = (touch.clientX - rect.left) / rect.width
    const y = (touch.clientY - rect.top) / rect.height

    const now = performance.now()
    const buf = mouseBufferRef.current
    buf.push({ x, y, t: now })
    if (buf.length > MOUSE_BUFFER_SIZE) buf.shift()

    let vx = 0
    let vy = 0
    if (buf.length >= 2) {
      const a = buf[buf.length - 2]
      const b = buf[buf.length - 1]
      const dt = (b.t - a.t) / 1000
      if (dt > 0) {
        vx = (b.x - a.x) / dt
        vy = (b.y - a.y) / dt
      }
    }

    inputRef.current = { mouseX: x, mouseY: y, mouseVX: vx, mouseVY: vy }
  }, [])

  // ── Tap/click → serve (если фаза serve) ───────────────────────────────────
  const handlePointerDown = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'serve') {
        return tennisEngine.applyAction(prev, { type: 'serve' })
      }
      return prev
    })
  }, [])

  // ── Публичные методы ───────────────────────────────────────────────────────
  const serve = useCallback(() => {
    setState((prev) => tennisEngine.applyAction(prev, { type: 'serve' }))
  }, [])

  const restart = useCallback(() => {
    recordedRef.current = false
    setState((prev) =>
      tennisEngine.applyAction(prev, { type: 'restart' })
    )
  }, [])

  const setDifficulty = useCallback((d: TennisDifficulty) => {
    recordedRef.current = false
    setState((prev) =>
      tennisEngine.applyAction(prev, { type: 'setDifficulty', difficulty: d })
    )
  }, [])

  // ── rAF игровой цикл ───────────────────────────────────────────────────────
  useEffect(() => {
    function loop(timestamp: number) {
      rafRef.current = requestAnimationFrame(loop)

      if (hiddenRef.current) {
        lastTimeRef.current = timestamp
        return
      }

      const prev = lastTimeRef.current
      lastTimeRef.current = timestamp
      if (prev === null) return

      const rawDt = (timestamp - prev) / 1000
      // Ограничиваем dt чтобы избежать скачков при потере фокуса
      const dt = Math.min(rawDt, 0.05)

      setState((currentState) => {
        if (currentState.matchOver && currentState.phase === 'gameEnd') {
          return currentState
        }

        const next = tennisEngine.applyAction(currentState, {
          type: 'tick',
          dt,
          input: inputRef.current,
        })

        // Звуковые эффекты
        if (next.lastHitBy !== currentState.lastHitBy) {
          if (next.lastHitBy === 'player') {
            const power = next.player.swingPower
            if (power > 0.7) {
              soundManager.playBonus() // сильный удар
            } else {
              soundManager.playEat()   // обычный удар
            }
          }
        }

        if (next.pointWinner && !currentState.pointWinner) {
          if (next.pointWinner === 'player') {
            soundManager.playVictory()
          } else {
            soundManager.playGameOver()
          }
        }

        // Сохраняем рекорд когда матч окончен
        if (next.matchOver && !currentState.matchOver && !recordedRef.current) {
          recordedRef.current = true
          saveGameRecord({
            gameId: 'pong',
            difficulty: next.difficulty,
            timeSeconds: Math.round(next.elapsedMs / 1000),
            score: tennisEngine.getScore(next),
            won: next.matchWinner === 'player',
          })
        }

        return next
      })
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── visibilitychange ───────────────────────────────────────────────────────
  useEffect(() => {
    function onVisibility() {
      hiddenRef.current = document.hidden
      if (!document.hidden) {
        lastTimeRef.current = null // сбрасываем dt при возврате
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // ── Слушатели событий мыши/тач ─────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('pointerdown', handlePointerDown)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [handleMouseMove, handleTouchMove, handlePointerDown])

  return {
    state,
    containerRef,
    serve,
    restart,
    setDifficulty,
  }
}
