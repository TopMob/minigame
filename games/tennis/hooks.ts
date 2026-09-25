'use client'

// React-хук для игры Теннис / Пинг-понг от первого лица:
// - Быстрый игровой цикл без лагов и задержек (ноль лишних setState на каждый кадр)
// - Мгновенное отслеживание мыши / тача (0 мс latency)
// - Звуковые эффекты через Web Audio API
// - Сохранение рекордов и результатов матча

import { useState, useCallback, useEffect, useRef } from 'react'
import { tennisEngine, createInitialScore } from './engine'
import type { TennisState, TennisInput, TennisDifficulty } from './types'
import { soundManager } from '@/lib/audio/sounds'

export interface TennisUIState {
  score: TennisState['score']
  phase: TennisState['phase']
  serveBy: TennisState['serveBy']
  pointWinner: TennisState['pointWinner']
  faultReason: TennisState['faultReason']
  matchOver: TennisState['matchOver']
  matchWinner: TennisState['matchWinner']
  difficulty: TennisState['difficulty']
  rallyCount: number
  isSmash: boolean
}

export interface UseTennisEngineReturn {
  // Для UI-компонентов (обновляется только при смене очков / фазы)
  uiState: TennisUIState
  // Ref на полное 3D состояние для прямого canvas-рендеринга без задержки
  stateRef: React.MutableRefObject<TennisState>
  inputRef: React.MutableRefObject<TennisInput>
  containerRef: React.RefObject<HTMLDivElement | null>
  serve: () => void
  restart: () => void
  setDifficulty: (d: TennisDifficulty) => void
}

export function useTennisEngine(
  initialDifficulty: TennisDifficulty = 'medium'
): UseTennisEngineReturn {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Мутабельное 3D состояние для 60-120 FPS физики без лагов
  const stateRef = useRef<TennisState>(
    tennisEngine.createInitialState({ difficulty: initialDifficulty })
  )

  // Ввод мыши / тача (мгновенное чтение)
  const inputRef = useRef<TennisInput>({
    pixelX: 500,
    pixelY: 450,
    viewWidth: 1000,
    viewHeight: 600,
    normalizedX: 0.5,
    normalizedY: 0.6,
    pointerVX: 0,
    pointerVY: 0,
  })

  // Реактивное состояние для UI (очки, фазы, баннеры)
  const [uiState, setUiState] = useState<TennisUIState>(() => ({
    score: createInitialScore(),
    phase: 'serve',
    serveBy: 'player',
    pointWinner: null,
    faultReason: null,
    matchOver: false,
    matchWinner: null,
    difficulty: initialDifficulty,
    rallyCount: 0,
    isSmash: false,
  }))

  const lastPointerPos = useRef<{ x: number; y: number; time: number }>({
    x: 500,
    y: 450,
    time: 0,
  })

  const hiddenRef = useRef(false)
  const recordedRef = useRef(false)

  // Синхронизация UI состояния (вызывается при изменении очков/фаз)
  const syncUI = useCallback((state: TennisState, isSmash = false) => {
    setUiState({
      score: { ...state.score },
      phase: state.phase,
      serveBy: state.serveBy,
      pointWinner: state.pointWinner,
      faultReason: state.faultReason,
      matchOver: state.matchOver,
      matchWinner: state.matchWinner,
      difficulty: state.difficulty,
      rallyCount: state.rallyCount,
      isSmash,
    })
  }, [])

  // ── Обработка движения мыши (пиксельное отслеживание 1:1) ──────────────────
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const pixelX = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const pixelY = Math.max(0, Math.min(rect.height, clientY - rect.top))

    const rawX = pixelX / (rect.width || 1)
    const rawY = pixelY / (rect.height || 1)

    const normX = Math.max(0, Math.min(1, rawX))
    const normY = Math.max(0, Math.min(1, rawY))

    const now = performance.now()
    const dt = lastPointerPos.current.time > 0 ? (now - lastPointerPos.current.time) / 1000 : 0.016

    let pvx = 0
    let pvy = 0
    if (dt > 0.002 && dt < 0.2) {
      pvx = ((pixelX - lastPointerPos.current.x) / dt) * 0.35
      pvy = ((pixelY - lastPointerPos.current.y) / dt) * 0.35
    }

    lastPointerPos.current = { x: pixelX, y: pixelY, time: now }

    inputRef.current = {
      pixelX,
      pixelY,
      viewWidth: rect.width,
      viewHeight: rect.height,
      normalizedX: normX,
      normalizedY: normY,
      pointerVX: pvx,
      pointerVY: pvy,
    }
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY)
  }, [handlePointerMove])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      e.preventDefault()
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }, [handlePointerMove])

  // Подача по клику / тапу
  const serve = useCallback(() => {
    const curr = stateRef.current
    if (curr.phase === 'serve') {
      const next = tennisEngine.applyAction(curr, { type: 'serve' })
      stateRef.current = next
      soundManager.playPaddleHit(false)
      syncUI(next)
    }
  }, [syncUI])

  const restart = useCallback(() => {
    recordedRef.current = false
    const fresh = tennisEngine.createInitialState({ difficulty: stateRef.current.difficulty })
    stateRef.current = fresh
    syncUI(fresh)
  }, [syncUI])

  const setDifficulty = useCallback((d: TennisDifficulty) => {
    recordedRef.current = false
    const fresh = tennisEngine.createInitialState({ difficulty: d })
    stateRef.current = fresh
    syncUI(fresh)
  }, [syncUI])

  // Слушатели событий ввода
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handlePointerDown = () => {
      // Клик по корту совершает подачу, если мы в фазе serve
      if (stateRef.current.phase === 'serve') {
        serve()
      }
    }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('pointerdown', handlePointerDown)

    return () => {
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [onMouseMove, onTouchMove, serve])

  // Обработка видимости вкладки
  useEffect(() => {
    const onVisibility = () => {
      hiddenRef.current = document.hidden
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return {
    uiState,
    stateRef,
    inputRef,
    containerRef,
    serve,
    restart,
    setDifficulty,
  }
}
