// Движок игры Теннис (3D от первого лица) — реализует GameEngine<TennisState, TennisAction>
// Чистые функции перехода состояний, правила розыгрыша очков и геймов

import type { GameEngine } from '../_lib/types'
import type {
  TennisState,
  TennisInput,
  TennisOptions,
  TennisPlayer,
  TennisScore,
  TennisBall,
} from './types'
import {
  TABLE_WIDTH,
  TABLE_LENGTH,
  NET_Z,
  PLAYER_PADDLE_Z,
  SETS_TO_WIN,
} from './types'
import { stepBall3D, checkPlayerHit, springLerp } from './physics'
import { tickOpponent3D, createInitialOpponent } from './ai'

export function createInitialScore(): TennisScore {
  return {
    playerPoints: 0,
    opponentPoints: 0,
    playerGames: 0,
    opponentGames: 0,
    playerSets: 0,
    opponentSets: 0,
  }
}

export function createServeBall(serveBy: 'player' | 'opponent'): TennisBall {
  if (serveBy === 'player') {
    return {
      x: 0,
      y: 26,
      z: 15,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      bouncesPlayer: 0,
      bouncesOpponent: 0,
      isSmash: false,
    }
  } else {
    return {
      x: 0,
      y: 30,
      z: TABLE_LENGTH - 15,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      bouncesPlayer: 0,
      bouncesOpponent: 0,
      isSmash: false,
    }
  }
}

export function createInitialPlayer(): TennisPlayer {
  return {
    x: 0,
    y: 25,
    z: PLAYER_PADDLE_Z,
    targetX: 0,
    targetY: 25,
    vx: 0,
    vy: 0,
    tiltX: 0,
    tiltY: 0,
    swingPower: 0,
    isHitting: false,
    hitTimer: 0,
  }
}

/**
 * Начисляет очко и обновляет теннисный счет (15/30/40/деюс/геймы/сеты)
 */
export function resolvePoint(
  score: TennisScore,
  winner: 'player' | 'opponent'
): {
  score: TennisScore
  gameWon: boolean
  setWon: boolean
  matchWon: boolean
} {
  let {
    playerPoints,
    opponentPoints,
    playerGames,
    opponentGames,
    playerSets,
    opponentSets,
  } = score

  if (winner === 'player') playerPoints++
  else opponentPoints++

  let gameWon = false
  let setWon = false
  let matchWon = false

  // Гейм: победа при >= 4 очках и разрыве >= 2
  const maxPts = Math.max(playerPoints, opponentPoints)
  const minPts = Math.min(playerPoints, opponentPoints)
  const isGameOver = maxPts >= 4 && maxPts - minPts >= 2

  if (isGameOver) {
    gameWon = true
    const gameWinner = playerPoints > opponentPoints ? 'player' : 'opponent'
    if (gameWinner === 'player') playerGames++
    else opponentGames++

    playerPoints = 0
    opponentPoints = 0

    // Сет: до 6 геймов с разрывом 2
    const maxGames = Math.max(playerGames, opponentGames)
    const minGames = Math.min(playerGames, opponentGames)
    const isSetOver = (maxGames >= 6 && maxGames - minGames >= 2) || maxGames >= 7

    if (isSetOver) {
      setWon = true
      const setWinner = playerGames > opponentGames ? 'player' : 'opponent'
      if (setWinner === 'player') playerSets++
      else opponentSets++

      playerGames = 0
      opponentGames = 0

      if (playerSets >= SETS_TO_WIN || opponentSets >= SETS_TO_WIN) {
        matchWon = true
      }
    }
  }

  return {
    score: {
      playerPoints,
      opponentPoints,
      playerGames,
      opponentGames,
      playerSets,
      opponentSets,
    },
    gameWon,
    setWon,
    matchWon,
  }
}

export type TennisAction =
  | { type: 'serve' }
  | { type: 'tick'; dt: number; input: TennisInput }
  | { type: 'restart' }
  | { type: 'setDifficulty'; difficulty: TennisState['difficulty'] }
  | { type: 'pause' }
  | { type: 'resume' }

export const tennisEngine: GameEngine<TennisState, TennisAction, TennisOptions> = {
  createInitialState(opts: TennisOptions = {}): TennisState {
    const difficulty = opts.difficulty ?? 'medium'
    const serveBy: 'player' | 'opponent' = 'player'
    return {
      phase: 'serve',
      ball: createServeBall(serveBy),
      player: createInitialPlayer(),
      opponent: createInitialOpponent(),
      score: createInitialScore(),
      lastHitBy: null,
      serveBy,
      slowMotionTimer: 0,
      faultReason: null,
      pointWinner: null,
      elapsedMs: 0,
      difficulty,
      matchOver: false,
      matchWinner: null,
      rallyCount: 0,
    }
  },

  applyAction(state: TennisState, action: TennisAction): TennisState {
    if (action.type === 'restart') {
      return tennisEngine.createInitialState({ difficulty: state.difficulty })
    }

    if (action.type === 'setDifficulty') {
      return tennisEngine.createInitialState({ difficulty: action.difficulty })
    }

    if (action.type === 'serve') {
      if (state.phase !== 'serve') return state

      const isPlayer = state.serveBy === 'player'
      // Начальная подача мяча
      let serveBall: TennisBall
      if (isPlayer) {
        serveBall = {
          x: state.player.x * 0.4,
          y: 28,
          z: 20,
          vx: state.player.vx * 0.2,
          vy: 110,
          vz: 260,
          spinX: 0,
          spinY: 0.5,
          bouncesPlayer: 0,
          bouncesOpponent: 0,
          isSmash: false,
        }
      } else {
        // Подача соперника
        serveBall = {
          x: 0,
          y: 30,
          z: TABLE_LENGTH - 20,
          vx: (Math.random() - 0.5) * 40,
          vy: 110,
          vz: -250,
          spinX: 0,
          spinY: 0.4,
          bouncesPlayer: 0,
          bouncesOpponent: 0,
          isSmash: false,
        }
      }

      return {
        ...state,
        phase: 'rally',
        ball: serveBall,
        lastHitBy: state.serveBy,
        faultReason: null,
        pointWinner: null,
        rallyCount: 1,
      }
    }

    if (action.type === 'pause' || action.type === 'resume') {
      return state
    }

    if (action.type === 'tick') {
      if (state.matchOver || state.phase === 'gameEnd') return state

      const { dt, input } = action
      const effectiveDt = state.slowMotionTimer > 0 ? dt * 0.35 : dt
      const newSlowTimer = Math.max(0, state.slowMotionTimer - dt * 1000)

      let newState: TennisState = {
        ...state,
        slowMotionTimer: newSlowTimer,
        elapsedMs: state.elapsedMs + dt * 1000,
      }

      // Обновляем ракетку игрока по вводу мыши в любых фазах
      const updatedPlayer = updatePlayerState(state.player, input, effectiveDt)

      if (state.phase === 'serve') {
        // В фазе подачи мяч парит перед подающим
        const ball = createServeBall(state.serveBy)
        if (state.serveBy === 'player') {
          ball.x = updatedPlayer.x * 0.6
          ball.y = updatedPlayer.y + 4
        }
        return {
          ...newState,
          player: updatedPlayer,
          ball,
        }
      }

      if (state.phase === 'pointEnd') {
        if (newSlowTimer <= 0) {
          // Переход к следующей подаче
          const nextServe = state.pointWinner === 'player' ? 'player' : 'opponent'
          return {
            ...newState,
            phase: 'serve',
            serveBy: nextServe,
            ball: createServeBall(nextServe),
            lastHitBy: null,
            faultReason: null,
            pointWinner: null,
            player: { ...updatedPlayer, isHitting: false, hitTimer: 0 },
            rallyCount: 0,
          }
        }
        // Замедленное движение мяча для красивого завершения очка
        const physResult = stepBall3D(state.ball, effectiveDt)
        return {
          ...newState,
          player: updatedPlayer,
          ball: physResult.ball,
        }
      }

      // ── ФАЗА RALLY ─────────────────────────────────────────────────────────
      const prevBallZ = state.ball.z

      // 1. Проверяем удар ракеткой игрока
      const playerHitCheck = checkPlayerHit(state.ball, prevBallZ, updatedPlayer)
      let ball = playerHitCheck.hit ? playerHitCheck.newBall : state.ball
      let lastHitBy = playerHitCheck.hit ? 'player' as const : state.lastHitBy
      let rallyCount = state.rallyCount + (playerHitCheck.hit ? 1 : 0)

      if (playerHitCheck.hit) {
        updatedPlayer.isHitting = true
        updatedPlayer.hitTimer = 220
      }

      // 2. Обновляем ракетку соперника (бота)
      const botResult = tickOpponent3D({ ...state, lastHitBy, rallyCount }, prevBallZ, effectiveDt)
      const opponent = botResult.opponent
      if (botResult.hitBall) {
        ball = botResult.hitBall
        lastHitBy = 'opponent'
        rallyCount++
      }

      // 3. Шаг физики полета мяча в 3D
      const physResult = stepBall3D(ball, effectiveDt)
      ball = physResult.ball

      // 4. Определение исхода розыгрыша (очко, аут, сетка, двойной отскок)
      let pointWinner: 'player' | 'opponent' | null = null
      let faultReason: TennisState['faultReason'] = null

      // А) Попадание в сетку
      if (physResult.hitNet) {
        faultReason = 'net'
        pointWinner = lastHitBy === 'player' ? 'opponent' : 'player'
      }

      // Б) Двойной отскок на столе
      if (!pointWinner) {
        if (ball.bouncesPlayer >= 2) {
          // Мяч дважды отскочил на половине игрока — игрок не отбил!
          pointWinner = 'opponent'
          faultReason = 'double_bounce'
        } else if (ball.bouncesOpponent >= 2) {
          // Мяч дважды отскочил на половине соперника — очко игроку!
          pointWinner = 'player'
          faultReason = 'double_bounce'
        }
      }

      // В) Мяч улетел за пределы стола и упал ниже уровня стола (y < -15)
      if (!pointWinner && ball.y < -15) {
        if (lastHitBy === 'player') {
          // Если игрок ударил:
          // Если мяч отскочил на стороне соперника хотя бы 1 раз — победа игрока!
          if (ball.bouncesOpponent >= 1) {
            pointWinner = 'player'
          } else {
            // Мяч улетел в аут без отскока на половине соперника
            pointWinner = 'opponent'
            faultReason = 'out'
          }
        } else if (lastHitBy === 'opponent') {
          // Если соперник ударил:
          if (ball.bouncesPlayer >= 1) {
            pointWinner = 'opponent'
          } else {
            pointWinner = 'player'
            faultReason = 'out'
          }
        }
      }

      // Г) Мяч пролетел далеко за спину игроку (z < -30)
      if (!pointWinner && ball.z < -30 && ball.vz < 0) {
        pointWinner = 'opponent'
        faultReason = 'miss'
      }

      // Д) Мяч улетел далеко за стол соперника (z > TABLE_LENGTH + 60)
      if (!pointWinner && ball.z > TABLE_LENGTH + 60 && ball.vz > 0) {
        if (lastHitBy === 'player' && ball.bouncesOpponent >= 1) {
          pointWinner = 'player'
        } else {
          pointWinner = 'opponent'
          faultReason = 'out'
        }
      }

      // ── НАЧИСЛЕНИЕ ОЧКА ───────────────────────────────────────────────────
      if (pointWinner) {
        const { score, matchWon } = resolvePoint(state.score, pointWinner)
        const matchWinner = matchWon ? pointWinner : null
        return {
          ...newState,
          ball,
          player: updatedPlayer,
          opponent,
          lastHitBy,
          score,
          faultReason,
          pointWinner,
          phase: matchWon ? 'gameEnd' : 'pointEnd',
          slowMotionTimer: 650, // эффект замедления на победном очке
          matchOver: matchWon,
          matchWinner,
          rallyCount,
        }
      }

      return {
        ...newState,
        ball,
        player: updatedPlayer,
        opponent,
        lastHitBy,
        rallyCount,
      }
    }

    return state
  },

  isValidAction(state: TennisState, action: TennisAction): boolean {
    if (action.type === 'restart') return true
    if (action.type === 'setDifficulty') return true
    if (action.type === 'serve') return state.phase === 'serve'
    if (action.type === 'tick') return !state.matchOver
    return true
  },

  isGameOver(state: TennisState): boolean {
    return state.matchOver
  },

  getScore(state: TennisState): number {
    return (
      state.score.playerSets * 100 +
      state.score.playerGames * 10 +
      state.score.playerPoints
    )
  },

  hashState(state: TennisState): string {
    const { ball, score } = state
    return `${Math.round(ball.x)},${Math.round(ball.y)},${Math.round(ball.z)}:${score.playerPoints}-${score.opponentPoints}`
  },
}

/**
 * Плавное обновление координат и наклона ракетки игрока
 */
function updatePlayerState(
  player: TennisPlayer,
  input: TennisInput,
  dt: number
): TennisPlayer {
  // Нормализованные координаты (0..1) проецируем на 3D диапазон стола
  // Ширина стола по X: от -85 до +85 см
  const targetX = (input.normalizedX - 0.5) * (TABLE_WIDTH * 1.25)
  // Высота по Y: от 6 до 55 см над столом
  const targetY = 55 - input.normalizedY * 48

  // Пружинная интерполяция с высокой отзывчивостью (stiffness = 24 для мгновенного отклика без задержек)
  const stiffness = 26
  const newX = springLerp(player.x, targetX, stiffness, dt)
  const newY = springLerp(player.y, targetY, stiffness, dt)

  // Скорость ракетки в см/с
  const vx = (newX - player.x) / (dt || 0.016)
  const vy = (newY - player.y) / (dt || 0.016)

  // Наклон ракетки при взмахе
  const tiltX = Math.max(-0.45, Math.min(0.45, (vx / 400) * 0.45))
  const tiltY = Math.max(-0.4, Math.min(0.4, (vy / 350) * 0.35))

  const speed = Math.sqrt(vx * vx + vy * vy)
  const swingPower = Math.min(1.0, speed / 550)

  const hitTimer = Math.max(0, player.hitTimer - dt * 1000)

  return {
    x: newX,
    y: newY,
    z: PLAYER_PADDLE_Z,
    targetX,
    targetY,
    vx,
    vy,
    tiltX,
    tiltY,
    swingPower,
    isHitting: hitTimer > 0,
    hitTimer,
  }
}
