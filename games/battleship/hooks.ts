'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { soundManager } from '@/lib/audio/sounds'
import { saveGameRecord } from '@/lib/storage/records'
import { getBotBattleshipShot } from './ai'
import {
  canPlaceShip,
  createEmptyBoard,
  createInitialBattleshipState,
  executeShot,
  generateRandomFleet,
  getRemainingShipsToPlace,
  getShipCoordinates,
  isFleetDefeated,
  populateBoardWithFleet,
} from './engine'
import {
  TOTAL_SHIPS,
  type BattleshipDifficulty,
  type BattleshipState,
  type PlacedShip,
  type ShipOrientation,
  type ShipType,
} from './types'

export function useBattleship(initialDifficulty: BattleshipDifficulty = 'medium') {
  const [state, setState] = useState<BattleshipState>(() =>
    createInitialBattleshipState(initialDifficulty)
  )

  const isSavedRef = useRef(false)
  const botTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Очистка таймеров
  useEffect(() => {
    return () => {
      if (botTurnTimeoutRef.current) clearTimeout(botTurnTimeoutRef.current)
    }
  }, [])

  // Сохранение рекорда при завершении игры
  useEffect(() => {
    if (state.phase !== 'game_over') {
      isSavedRef.current = false
      return
    }
    if (isSavedRef.current) return
    isSavedRef.current = true

    const timeSeconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000))
    const isHumanWin = state.winner === 'player'

    if (isHumanWin) {
      soundManager.playVictory()
    } else {
      soundManager.playGameOver()
    }

    const accuracy =
      state.shotsFired.player > 0
        ? Math.round((state.hitsCount.player / state.shotsFired.player) * 100)
        : 0

    const survivingShips = state.playerFleet.filter((s) => !s.isSunk).length
    const diffMultiplier =
      state.difficulty === 'hard' ? 3 : state.difficulty === 'medium' ? 2 : 1

    const finalScore = isHumanWin
      ? Math.round((500 + survivingShips * 50 + accuracy * 5) * diffMultiplier)
      : Math.round(state.hitsCount.player * 15)

    saveGameRecord({
      gameId: 'battleship',
      difficulty: state.difficulty,
      score: finalScore,
      timeSeconds,
      won: isHumanWin,
    })
  }, [state])

  // Логика хода бота
  useEffect(() => {
    if (state.phase !== 'battle') return
    if (state.currentTurn !== 'bot' || state.isBotThinking) return

    const delay =
      state.difficulty === 'hard' ? 800 : state.difficulty === 'medium' ? 650 : 500

    setState((s) => ({ ...s, isBotThinking: true }))

    botTurnTimeoutRef.current = setTimeout(() => {
      setState((current) => {
        if (current.phase !== 'battle' || current.currentTurn !== 'bot') {
          return { ...current, isBotThinking: false }
        }

        const [r, c] = getBotBattleshipShot(
          current.playerBoard,
          current.playerFleet,
          current.difficulty
        )

        // Стреляем по доске игрока
        soundManager.playBattleshipShot()
        const { nextBoard, nextFleet, shotResult } = executeShot(
          current.playerBoard,
          current.playerFleet,
          r,
          c
        )

        const isPlayerDead = isFleetDefeated(nextFleet)
        const newBotHits =
          shotResult.result === 'miss'
            ? current.hitsCount.bot
            : current.hitsCount.bot + 1

        let logEntry = ''
        if (shotResult.result === 'sunk') {
          soundManager.playBattleshipSink()
          logEntry = `Враг потопил ваш ${shotResult.sunkShip?.name || 'корабль'}!`
        } else if (shotResult.result === 'hit') {
          soundManager.playBattleshipHit()
          logEntry = `Враг попал в ваш корабль! Враг стреляет снова.`
        } else {
          soundManager.playBattleshipMiss()
          logEntry = `Противник промахнулся. Ваш ход!`
        }

        const nextLogs = [logEntry, ...current.battleLog].slice(0, 8)

        if (isPlayerDead) {
          return {
            ...current,
            playerBoard: nextBoard,
            playerFleet: nextFleet,
            isBotThinking: false,
            phase: 'game_over',
            winner: 'bot',
            shotsFired: { ...current.shotsFired, bot: current.shotsFired.bot + 1 },
            hitsCount: { ...current.hitsCount, bot: newBotHits },
            lastBotShot: shotResult,
            battleLog: ['Ваш флот полностью уничтожен! Поражение.', ...nextLogs],
          }
        }

        // Если бот попал, он ходит снова
        const nextTurn = shotResult.result === 'miss' ? 'player' : 'bot'

        return {
          ...current,
          playerBoard: nextBoard,
          playerFleet: nextFleet,
          isBotThinking: false,
          currentTurn: nextTurn,
          shotsFired: { ...current.shotsFired, bot: current.shotsFired.bot + 1 },
          hitsCount: { ...current.hitsCount, bot: newBotHits },
          lastBotShot: shotResult,
          battleLog: nextLogs,
        }
      })
    }, delay)

    return () => {
      if (botTurnTimeoutRef.current) clearTimeout(botTurnTimeoutRef.current)
    }
  }, [state.currentTurn, state.phase, state.isBotThinking])

  // --- ДЕЙСТВИЯ ФАЗЫ РАССТАНОВКИ ---

  // Установка корабля вручную
  const placeShipAt = useCallback(
    (row: number, col: number) => {
      setState((prev) => {
        if (prev.phase !== 'placement') return prev
        const size = prev.selectedShipSize
        if (!size) return prev

        const remaining = getRemainingShipsToPlace(prev.playerFleet)
        if (remaining[size] <= 0) return prev

        if (!canPlaceShip(prev.playerBoard, row, col, size, prev.placementOrientation)) {
          return prev
        }

        soundManager.playPlacementSnap()

        const shipId = `player_ship_${size}_${Date.now()}`
        const coords = getShipCoordinates(row, col, size, prev.placementOrientation)
        const name =
          size === 4 ? 'Линкор' : size === 3 ? 'Крейсер' : size === 2 ? 'Эсминец' : 'Катер'

        const newShip: PlacedShip = {
          id: shipId,
          size,
          name,
          row,
          col,
          orientation: prev.placementOrientation,
          hits: 0,
          isSunk: false,
          coords,
        }

        const nextFleet = [...prev.playerFleet, newShip]
        const nextBoard = populateBoardWithFleet(nextFleet)

        // Автоматически переключаем выбор на следующий доступный корабль
        const nextRemaining = getRemainingShipsToPlace(nextFleet)
        let nextSelected = prev.selectedShipSize
        if (nextRemaining[size] <= 0) {
          const available = ([4, 3, 2, 1] as ShipType[]).find(
            (s) => nextRemaining[s] > 0
          )
          nextSelected = available || null
        }

        return {
          ...prev,
          playerFleet: nextFleet,
          playerBoard: nextBoard,
          selectedShipSize: nextSelected,
        }
      })
    },
    []
  )

  // Удаление корабля с поля
  const removeShip = useCallback((shipId: string) => {
    setState((prev) => {
      if (prev.phase !== 'placement') return prev
      const removed = prev.playerFleet.find((s) => s.id === shipId)
      if (!removed) return prev

      soundManager.playPlacementSnap()
      const nextFleet = prev.playerFleet.filter((s) => s.id !== shipId)
      const nextBoard = populateBoardWithFleet(nextFleet)

      return {
        ...prev,
        playerFleet: nextFleet,
        playerBoard: nextBoard,
        selectedShipSize: removed.size,
      }
    })
  }, [])

  // Случайная расстановка флота игрока
  const randomizePlayerFleet = useCallback(() => {
    soundManager.playSonar()
    const fleet = generateRandomFleet()
    const board = populateBoardWithFleet(fleet)

    setState((prev) => ({
      ...prev,
      playerFleet: fleet,
      playerBoard: board,
      selectedShipSize: null,
    }))
  }, [])

  // Очистка поля расстановки
  const clearPlayerFleet = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playerFleet: [],
      playerBoard: createEmptyBoard(),
      selectedShipSize: 4,
    }))
  }, [])

  const setOrientation = useCallback((orientation: ShipOrientation) => {
    setState((prev) => ({ ...prev, placementOrientation: orientation }))
  }, [])

  const toggleOrientation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      placementOrientation:
        prev.placementOrientation === 'horizontal' ? 'vertical' : 'horizontal',
    }))
  }, [])

  const setSelectedShipSize = useCallback((size: ShipType | null) => {
    setState((prev) => ({ ...prev, selectedShipSize: size }))
  }, [])

  // Старт битвы
  const startBattle = useCallback(() => {
    if (state.playerFleet.length < TOTAL_SHIPS) return

    soundManager.playSonar()

    // Генерируем флот бота
    const botFleet = generateRandomFleet()
    const botBoard = populateBoardWithFleet(botFleet)

    setState((prev) => ({
      ...prev,
      phase: 'battle',
      botFleet,
      botBoard,
      currentTurn: 'player',
      startTime: Date.now(),
      battleLog: ['Корабли заняли позиции. Ваш первый залп по радару!'],
    }))
  }, [state.playerFleet.length])

  // --- ДЕЙСТВИЯ ФАЗЫ БОЯ ---

  // Выстрел игрока по флоту бота
  const fireAtBot = useCallback(
    (row: number, col: number) => {
      setState((prev) => {
        if (prev.phase !== 'battle' || prev.currentTurn !== 'player' || prev.isBotThinking) {
          return prev
        }

        const cell = prev.botBoard[row]?.[col]
        if (!cell || cell.state === 'miss' || cell.state === 'hit' || cell.state === 'sunk') {
          return prev
        }

        soundManager.playBattleshipShot()

        const { nextBoard, nextFleet, shotResult } = executeShot(
          prev.botBoard,
          prev.botFleet,
          row,
          col
        )

        const isBotDead = isFleetDefeated(nextFleet)
        const newPlayerHits =
          shotResult.result === 'miss'
            ? prev.hitsCount.player
            : prev.hitsCount.player + 1

        let logEntry = ''
        if (shotResult.result === 'sunk') {
          soundManager.playBattleshipSink()
          logEntry = `Вы потопили ${shotResult.sunkShip?.name || 'корабль'} противника! Дополнительный выстрел.`
        } else if (shotResult.result === 'hit') {
          soundManager.playBattleshipHit()
          logEntry = `Прямое попадание! Ваш дополнительный выстрел.`
        } else {
          soundManager.playBattleshipMiss()
          logEntry = `Мимо! Ход переходит к противнику.`
        }

        const nextLogs = [logEntry, ...prev.battleLog].slice(0, 8)

        if (isBotDead) {
          return {
            ...prev,
            botBoard: nextBoard,
            botFleet: nextFleet,
            phase: 'game_over',
            winner: 'player',
            shotsFired: { ...prev.shotsFired, player: prev.shotsFired.player + 1 },
            hitsCount: { ...prev.hitsCount, player: newPlayerHits },
            lastPlayerShot: shotResult,
            battleLog: ['Все корабли противника уничтожены! Полная победа!', ...nextLogs],
          }
        }

        // Если игрок попал, он ходит снова! Иначе ход бота
        const nextTurn = shotResult.result === 'miss' ? 'bot' : 'player'

        return {
          ...prev,
          botBoard: nextBoard,
          botFleet: nextFleet,
          currentTurn: nextTurn,
          shotsFired: { ...prev.shotsFired, player: prev.shotsFired.player + 1 },
          hitsCount: { ...prev.hitsCount, player: newPlayerHits },
          lastPlayerShot: shotResult,
          battleLog: nextLogs,
        }
      })
    },
    []
  )

  // Перезапуск игры
  const restart = useCallback(() => {
    if (botTurnTimeoutRef.current) clearTimeout(botTurnTimeoutRef.current)
    setState((prev) => createInitialBattleshipState(prev.difficulty))
    isSavedRef.current = false
  }, [])

  const setDifficulty = useCallback((diff: BattleshipDifficulty) => {
    setState((prev) => {
      if (prev.difficulty === diff) return prev
      return createInitialBattleshipState(diff)
    })
    isSavedRef.current = false
  }, [])

  return {
    state,
    placeShipAt,
    removeShip,
    randomizePlayerFleet,
    clearPlayerFleet,
    setOrientation,
    toggleOrientation,
    setSelectedShipSize,
    startBattle,
    fireAtBot,
    restart,
    setDifficulty,
  }
}
