'use client'

// React-хук для игры Танчики:
// - Высокопроизводительный 60 FPS requestAnimationFrame цикл физики
// - Мгновенный отклик клавиш и сенсорного ввода
// - Звуковое сопровождение через SoundEffectsManager
// - Синхронизация UI-состояния и сохранение рекордов

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Difficulty,
  TanksState,
  Direction,
} from './types'
import {
  createInitialTanksState,
  updateTanksEngine,
  SoundCallbacks,
} from './engine'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'

const TANKS_BEST_KEY = 'minigame:tanks_best_'

export function getTanksBestScore(diff: Difficulty): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(TANKS_BEST_KEY + diff)
    return raw ? parseInt(raw, 10) : 0
  } catch {
    return 0
  }
}

export function saveTanksBestScore(diff: Difficulty, score: number) {
  if (typeof window === 'undefined') return
  try {
    const current = getTanksBestScore(diff)
    if (score > current) {
      localStorage.setItem(TANKS_BEST_KEY + diff, score.toString())
    }
  } catch {}
}

export interface TanksUIState {
  stage: number
  score: number
  highScore: number
  lives: number
  enemiesRemaining: number
  enemiesOnField: number
  isGameOver: boolean
  isVictory: boolean
  isPaused: boolean
  baseDestroyed: boolean
  difficulty: Difficulty
  shieldActive: boolean
  freezeActive: boolean
  shovelActive: boolean
  playerTier: number
  isMuted: boolean
}

export interface UseTanksReturn {
  stateRef: React.MutableRefObject<TanksState>
  uiState: TanksUIState
  restart: () => void
  nextStage: () => void
  togglePause: () => void
  toggleMute: () => void
  setDifficulty: (d: Difficulty) => void
  setMoveDirection: (dir: Direction | null) => void
  setShootPressed: (pressed: boolean) => void
}

export function useTanks(initialDifficulty: Difficulty = 'medium'): UseTanksReturn {
  const [difficulty, setDifficultyState] = useState<Difficulty>(initialDifficulty)
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted)

  // Мутабельное состояние игры для 60 FPS рендеринга без React lag
  const stateRef = useRef<TanksState>(
    createInitialTanksState(
      initialDifficulty,
      1,
      0,
      getTanksBestScore(initialDifficulty)
    )
  )

  // Ввод клавиатуры / виртуального контроллера
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
  })

  // Реактивное состояние для интерфейса пользователя
  const [uiState, setUiState] = useState<TanksUIState>(() => {
    const s = stateRef.current
    return {
      stage: s.stage,
      score: s.score,
      highScore: s.highScore,
      lives: s.lives,
      enemiesRemaining: s.enemiesRemaining,
      enemiesOnField: s.enemies.length,
      isGameOver: s.isGameOver,
      isVictory: s.isVictory,
      isPaused: s.isPaused,
      baseDestroyed: s.baseDestroyed,
      difficulty: s.difficulty,
      shieldActive: s.player.shieldTimer > 0,
      freezeActive: s.freezeTimer > 0,
      shovelActive: s.shovelTimer > 0,
      playerTier: s.player.tier,
      isMuted: soundManager.isMuted,
    }
  })

  const recordedRef = useRef(false)
  const soundCallbacksRef = useRef<SoundCallbacks>({
    onShoot: () => soundManager.playTankShoot(),
    onHit: () => soundManager.playTankHit(),
    onBrickHit: () => soundManager.playBrickHit(),
    onExplosion: (isBig) => soundManager.playTankExplosion(isBig),
    onPowerup: () => soundManager.playTankPowerup(),
    onBaseDestroy: () => soundManager.playBaseDestroy(),
  })

  // Функция перезапуска
  const restart = useCallback(() => {
    recordedRef.current = false
    const s = stateRef.current
    const best = getTanksBestScore(s.difficulty)
    stateRef.current = createInitialTanksState(s.difficulty, 1, 0, best)

    setUiState({
      stage: 1,
      score: 0,
      highScore: best,
      lives: stateRef.current.lives,
      enemiesRemaining: stateRef.current.enemiesRemaining,
      enemiesOnField: 0,
      isGameOver: false,
      isVictory: false,
      isPaused: false,
      baseDestroyed: false,
      difficulty: s.difficulty,
      shieldActive: true,
      freezeActive: false,
      shovelActive: false,
      playerTier: 1,
      isMuted: soundManager.isMuted,
    })
  }, [])

  // Переход на следующий этап
  const nextStage = useCallback(() => {
    const s = stateRef.current
    const nextStageNum = s.stage + 1
    const currentScore = s.score + 1000 // бонус за прохождение карты
    const best = Math.max(s.highScore, currentScore)

    saveTanksBestScore(s.difficulty, best)

    stateRef.current = createInitialTanksState(
      s.difficulty,
      nextStageNum,
      currentScore,
      best
    )
    // Сохраняем прокачку игрока
    stateRef.current.player.tier = s.player.tier

    soundManager.playVictory()
  }, [])

  // Пауза
  const togglePause = useCallback(() => {
    stateRef.current.isPaused = !stateRef.current.isPaused
    setUiState((prev) => ({ ...prev, isPaused: stateRef.current.isPaused }))
  }, [])

  // Звук
  const toggleMute = useCallback(() => {
    const muted = soundManager.toggleMute()
    setIsMuted(muted)
    setUiState((prev) => ({ ...prev, isMuted: muted }))
  }, [])

  // Смена сложности
  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d)
    const best = getTanksBestScore(d)
    stateRef.current = createInitialTanksState(d, 1, 0, best)
    recordedRef.current = false

    setUiState({
      stage: 1,
      score: 0,
      highScore: best,
      lives: stateRef.current.lives,
      enemiesRemaining: stateRef.current.enemiesRemaining,
      enemiesOnField: 0,
      isGameOver: false,
      isVictory: false,
      isPaused: false,
      baseDestroyed: false,
      difficulty: d,
      shieldActive: true,
      freezeActive: false,
      shovelActive: false,
      playerTier: 1,
      isMuted: soundManager.isMuted,
    })
  }, [])

  // Управление с мобильного D-Pad
  const setMoveDirection = useCallback((dir: Direction | null) => {
    inputRef.current.up = dir === 'up'
    inputRef.current.down = dir === 'down'
    inputRef.current.left = dir === 'left'
    inputRef.current.right = dir === 'right'
  }, [])

  // Управление кнопкой стрельбы
  const setShootPressed = useCallback((pressed: boolean) => {
    inputRef.current.shoot = pressed
  }, [])

  // Обработка клавиш клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем ввод в текстовые поля
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault()
          inputRef.current.up = true
          break
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault()
          inputRef.current.down = true
          break
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault()
          inputRef.current.left = true
          break
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault()
          inputRef.current.right = true
          break
        case 'Space':
        case 'KeyJ':
        case 'KeyK':
          e.preventDefault()
          inputRef.current.shoot = true
          break
        case 'KeyP':
        case 'Escape':
          e.preventDefault()
          togglePause()
          break
        case 'KeyR':
          e.preventDefault()
          restart()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          inputRef.current.up = false
          break
        case 'ArrowDown':
        case 'KeyS':
          inputRef.current.down = false
          break
        case 'ArrowLeft':
        case 'KeyA':
          inputRef.current.left = false
          break
        case 'ArrowRight':
        case 'KeyD':
          inputRef.current.right = false
          break
        case 'Space':
        case 'KeyJ':
        case 'KeyK':
          inputRef.current.shoot = false
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [togglePause, restart, toggleMute])

  // Главный 60 FPS цикл игры
  useEffect(() => {
    let animId: number
    let lastUiSync = 0

    const loop = (timestamp: number) => {
      const state = stateRef.current

      // Обновление движка
      updateTanksEngine(state, inputRef.current, soundCallbacksRef.current)

      // Синхронизация с UI (10 раз в секунду или при критических событиях)
      if (
        timestamp - lastUiSync > 100 ||
        state.isGameOver ||
        state.isVictory ||
        state.stageCleared
      ) {
        lastUiSync = timestamp

        setUiState({
          stage: state.stage,
          score: state.score,
          highScore: state.highScore,
          lives: state.lives,
          enemiesRemaining: state.enemiesRemaining,
          enemiesOnField: state.enemies.length,
          isGameOver: state.isGameOver,
          isVictory: state.isVictory,
          isPaused: state.isPaused,
          baseDestroyed: state.baseDestroyed,
          difficulty: state.difficulty,
          shieldActive: state.player.shieldTimer > 0,
          freezeActive: state.freezeTimer > 0,
          shovelActive: state.shovelTimer > 0,
          playerTier: state.player.tier,
          isMuted: soundManager.isMuted,
        })

        // Сохранение рекорда при завершении игры
        if ((state.isGameOver || state.isVictory) && !recordedRef.current) {
          recordedRef.current = true
          saveTanksBestScore(state.difficulty, state.score)
          saveGameRecord({
            gameId: 'tanks',
            difficulty: state.difficulty,
            score: state.score,
            timeSeconds: state.score,
            won: state.isVictory,
          })

          if (state.isGameOver) {
            soundManager.playGameOver()
          } else if (state.isVictory) {
            soundManager.playVictory()
          }
        }
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
    }
  }, [])

  return {
    stateRef,
    uiState,
    restart,
    nextStage,
    togglePause,
    toggleMute,
    setDifficulty,
    setMoveDirection,
    setShootPressed,
  }
}
