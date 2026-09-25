// Движок игры Теннис — реализует GameEngine<TennisState, TennisAction>
// Все переходы состояния — чистые функции без побочных эффектов

import type { GameEngine } from '../_lib/types'
import type {
  TennisState,
  TennisInput,
  TennisOptions,
  TennisPlayer,
  TennisScore,
} from './types'
import {
  COURT_W,
  COURT_H,
  NET_Y,
  PLAYER_BASE_Y,
  OPPONENT_BASE_Y,
  PADDLE_W,
  BALL_R,
  SETS_TO_WIN,
} from './types'
import { stepBall, applyHit, springLerp } from './physics'
import { tickOpponent, createInitialOpponent } from './ai'

// ─── Вспомогательные ────────────────────────────────────────────────────────

function createInitialScore(): TennisScore {
  return {
    playerPoints: 0,
    opponentPoints: 0,
    playerGames: 0,
    opponentGames: 0,
    playerSets: 0,
    opponentSets: 0,
  }
}

function createServeBall(serveBy: 'player' | 'opponent'): TennisState['ball'] {
  return {
    x: COURT_W / 2,
    y: serveBy === 'player' ? PLAYER_BASE_Y - 20 : OPPONENT_BASE_Y + 20,
    z: 20,
    vx: 0,
    vy: 0,
    vz: 0,
    spin: 0,
  }
}

function createInitialPlayer(): TennisPlayer {
  return {
    x: COURT_W / 2,
    y: PLAYER_BASE_Y,
    targetX: COURT_W / 2,
    targetY: PLAYER_BASE_Y,
    vx: 0,
    vy: 0,
    swingPower: 0,
    isHitting: false,
    hitTimer: 0,
  }
}

/**
 * Начисляет очко winner'у и обновляет теннисный счёт (15/30/40/game с деюс).
 * Возвращает новый score, а также флаг выигрыша гейма/сета.
 */
function resolvePoint(
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

  // Начисляем очко победителю
  if (winner === 'player') playerPoints++
  else opponentPoints++

  let gameWon = false
  let setWon = false
  let matchWon = false

  // Логика гейма: побеждает тот, у кого >= 4 очков И разрыв >= 2
  const maxPts = Math.max(playerPoints, opponentPoints)
  const minPts = Math.min(playerPoints, opponentPoints)
  const gameOver = maxPts >= 4 && maxPts - minPts >= 2

  if (gameOver) {
    gameWon = true
    const gameWinner = playerPoints > opponentPoints ? 'player' : 'opponent'
    if (gameWinner === 'player') playerGames++
    else opponentGames++

    // Сброс очков
    playerPoints = 0
    opponentPoints = 0

    // Логика сета: 6 геймов с разрывом 2 (или тай-брейк при 6:6 — упрощённо первый до 7)
    const maxGames = Math.max(playerGames, opponentGames)
    const minGames = Math.min(playerGames, opponentGames)
    const setOver =
      (maxGames >= 6 && maxGames - minGames >= 2) || maxGames >= 7

    if (setOver) {
      setWon = true
      const setWinner = playerGames > opponentGames ? 'player' : 'opponent'
      if (setWinner === 'player') playerSets++
      else opponentSets++

      // Сброс геймов
      playerGames = 0
      opponentGames = 0

      // Победа в матче
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

// ─── Тип действий ────────────────────────────────────────────────────────────

export type TennisAction =
  | { type: 'serve' }
  | { type: 'tick'; dt: number; input: TennisInput }
  | { type: 'restart' }
  | { type: 'setDifficulty'; difficulty: TennisState['difficulty'] }
  | { type: 'pause' }
  | { type: 'resume' }

// ─── Движок ──────────────────────────────────────────────────────────────────

export const tennisEngine: GameEngine<TennisState, TennisAction, TennisOptions> = {
  createInitialState(opts: TennisOptions = {}): TennisState {
    const difficulty = opts.difficulty ?? 'medium'
    const serveBy: 'player' | 'opponent' = Math.random() > 0.5 ? 'player' : 'opponent'
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
    }
  },

  applyAction(state: TennisState, action: TennisAction): TennisState {
    // ── restart ──────────────────────────────────────────────────────────────
    if (action.type === 'restart') {
      return tennisEngine.createInitialState({ difficulty: state.difficulty })
    }

    // ── setDifficulty ────────────────────────────────────────────────────────
    if (action.type === 'setDifficulty') {
      return tennisEngine.createInitialState({ difficulty: action.difficulty })
    }

    // ── serve ────────────────────────────────────────────────────────────────
    if (action.type === 'serve') {
      if (state.phase !== 'serve') return state

      const isPlayer = state.serveBy === 'player'
      const direction: 1 | -1 = isPlayer ? -1 : 1
      const serveBall = applyHit(
        { ...createServeBall(state.serveBy), z: 30 },
        0,           // paddleVX
        isPlayer ? 300 : -300, // paddleVY
        0,           // hitOffsetX (центральная подача)
        direction,
        0.5          // средняя сила
      )
      return {
        ...state,
        phase: 'rally',
        ball: serveBall,
        lastHitBy: state.serveBy,
        faultReason: null,
        pointWinner: null,
      }
    }

    // ── pause / resume ───────────────────────────────────────────────────────
    if (action.type === 'pause') return { ...state, phase: state.phase === 'serve' ? 'serve' : state.phase }
    if (action.type === 'resume') return state

    // ── tick ─────────────────────────────────────────────────────────────────
    if (action.type === 'tick') {
      if (state.phase === 'gameEnd') return state
      if (state.matchOver) return state

      const { dt, input } = action

      // Slow-motion: когда таймер активен — замедляем dt
      const effectiveDt = state.slowMotionTimer > 0 ? dt * 0.35 : dt
      const newSlowTimer = Math.max(0, state.slowMotionTimer - dt * 1000)

      let newState = { ...state, slowMotionTimer: newSlowTimer, elapsedMs: state.elapsedMs + dt * 1000 }

      if (state.phase === 'serve') {
        // В фазе подачи только двигаем ракетку игрока
        const { player } = updatePlayer(state.player, input, effectiveDt)
        return { ...newState, player }
      }

      if (state.phase === 'pointEnd') {
        // Ждём конца анимации (slowmotion завершится)
        if (newSlowTimer <= 0) {
          // Начинаем следующую подачу
          const nextServeBy: 'player' | 'opponent' =
            state.pointWinner === 'player' ? state.serveBy : (state.serveBy === 'player' ? 'opponent' : 'player')
          return {
            ...newState,
            phase: 'serve',
            ball: createServeBall(nextServeBy),
            serveBy: nextServeBy,
            faultReason: null,
            pointWinner: null,
            player: { ...state.player, isHitting: false, hitTimer: 0 },
          }
        }
        // Продолжаем физику мяча в замедлении (красивый эффект)
        const physResult = stepBall(state.ball, effectiveDt)
        return { ...newState, ball: physResult.ball }
      }

      // ── rally ────────────────────────────────────────────────────────────────
      // 1. Обновляем игрока и проверяем удар
      const { player, didHit: playerHit, hitBall: playerHitBall } = updatePlayer(
        state.player,
        input,
        effectiveDt,
        state.ball,
        state.lastHitBy
      )

      let ball = playerHit && playerHitBall ? playerHitBall : state.ball
      let lastHitBy = playerHit ? 'player' as const : state.lastHitBy

      // 2. Обновляем бота (только если игрок не только что ударил)
      let opponent = state.opponent
      if (!playerHit) {
        const botResult = tickOpponent({ ...state, lastHitBy }, effectiveDt)
        opponent = botResult.opponent
        if (botResult.hitBall) {
          ball = botResult.hitBall
          lastHitBy = 'opponent'
        }
      }

      // 3. Шаг физики мяча
      const physResult = stepBall(ball, effectiveDt)
      ball = physResult.ball

      // 4. Определяем, кто выиграл очко
      let faultReason: TennisState['faultReason'] = null
      let pointWinner: 'player' | 'opponent' | null = null

      if (physResult.hitNet) {
        // Мяч попал в сетку
        faultReason = 'net'
        pointWinner = lastHitBy === 'player' ? 'opponent' : 'player'
      } else if (physResult.outOfBounds) {
        // Мяч вышел за пределы корта по Y
        faultReason = 'out'
        if (ball.y < 0) {
          // Вылетел за базовую соперника → очко игроку (если последним бил игрок, иначе двойная ошибка)
          pointWinner = lastHitBy === 'player' ? 'player' : 'opponent'
        } else {
          // Вылетел за базовую игрока → очко сопернику
          pointWinner = lastHitBy === 'opponent' ? 'opponent' : 'player'
        }
      } else if (physResult.bounced && lastHitBy !== null) {
        // Мяч отскочил на земле.
        // В теннисе: если мяч отскочил на стороне СОПЕРНИКА — победа атакующего.
        // NET_Y делит корт: y <= NET_Y → сторона соперника, y > NET_Y → сторона игрока
        const bouncedOnOpponentSide = ball.y <= NET_Y
        const bouncedOnPlayerSide = ball.y > NET_Y

        if (bouncedOnOpponentSide && lastHitBy === 'player') {
          pointWinner = 'player'
        } else if (bouncedOnPlayerSide && lastHitBy === 'opponent') {
          pointWinner = 'opponent'
        }
        // Если отскок на своей стороне (игрок не успел отбить после отскока к себе)
        // — правило двойного отскока. Обрабатывается через outOfBounds когда мяч улетает.
      }

      if (pointWinner) {
        const { score, matchWon } = resolvePoint(state.score, pointWinner)
        const matchWinner = matchWon
          ? (pointWinner === 'player' ? 'player' as const : 'opponent' as const)
          : null
        return {
          ...newState,
          ball,
          player,
          opponent,
          lastHitBy,
          score,
          faultReason,
          pointWinner,
          phase: matchWon ? 'gameEnd' : 'pointEnd',
          slowMotionTimer: 600, // 600 мс замедления
          matchOver: matchWon,
          matchWinner,
        }
      }

      return {
        ...newState,
        ball,
        player,
        opponent,
        lastHitBy,
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
    // Возвращаем число выигранных сетов игрока * 100 + геймов * 10 + очков
    return (
      state.score.playerSets * 100 +
      state.score.playerGames * 10 +
      state.score.playerPoints
    )
  },

  hashState(state: TennisState): string {
    const { ball, score } = state
    return `${Math.round(ball.x)},${Math.round(ball.y)},${Math.round(ball.z)}:${score.playerSets}-${score.opponentSets}`
  },
}

// ─── Вспомогательные для обновления игрока ───────────────────────────────────

const PLAYER_ZONE_MIN_Y = COURT_H * 0.55
const PLAYER_ZONE_MAX_Y = COURT_H - 10
const PADDLE_H_HALF = 8

function updatePlayer(
  player: TennisPlayer,
  input: TennisInput,
  dt: number,
  ball?: TennisState['ball'],
  lastHitBy?: TennisState['lastHitBy']
): { player: TennisPlayer; didHit: boolean; hitBall: TennisState['ball'] | null } {
  // Целевая позиция из мыши (денормализованная)
  const rawTargetX = input.mouseX * COURT_W
  const rawTargetY = PLAYER_ZONE_MIN_Y + input.mouseY * (PLAYER_ZONE_MAX_Y - PLAYER_ZONE_MIN_Y)

  const targetX = Math.max(PADDLE_W / 2, Math.min(COURT_W - PADDLE_W / 2, rawTargetX))
  const targetY = Math.max(PLAYER_ZONE_MIN_Y, Math.min(PLAYER_ZONE_MAX_Y, rawTargetY))

  // Пружинная интерполяция ракетки (stiffness = 10 → плавная инерция)
  const stiffness = 10
  const newX = springLerp(player.x, targetX, stiffness, dt)
  const newY = springLerp(player.y, targetY, stiffness, dt)

  // Скорость ракетки
  const vx = (newX - player.x) / dt
  const vy = (newY - player.y) / dt

  // Сила удара из скорости мыши
  const mouseSpeed = Math.sqrt(input.mouseVX ** 2 + input.mouseVY ** 2)
  const swingPower = Math.min(1, mouseSpeed / 800)

  // Убывание hitTimer
  const hitTimer = Math.max(0, player.hitTimer - dt * 1000)
  const isHitting = hitTimer > 0

  let didHit = false
  let hitBall: TennisState['ball'] | null = null

  // Проверяем контакт с мячом (только в фазе rally, только если не только что ударили)
  if (ball && lastHitBy !== 'player') {
    const CONTACT_R = PADDLE_W / 2 + BALL_R + 4
    const dx = ball.x - newX
    const dy = ball.y - newY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < CONTACT_R && ball.z <= 40 && ball.z >= -5) {
      // Удар! Вычисляем вектор
      const hitOffsetX = Math.max(-1, Math.min(1, dx / (PADDLE_W / 2)))
      hitBall = applyHit(
        ball,
        vx,           // скорость ракетки по X
        vy,           // скорость ракетки по Y
        hitOffsetX,
        -1,           // игрок бьёт вверх (в сторону соперника, direction=-1 → vy отрицательный)
        swingPower
      )
      didHit = true
    }
  }

  const newPlayer: TennisPlayer = {
    x: newX,
    y: newY,
    targetX,
    targetY,
    vx,
    vy,
    swingPower,
    isHitting: didHit ? true : isHitting,
    hitTimer: didHit ? 200 : hitTimer, // 200 мс анимация удара
  }

  return { player: newPlayer, didHit, hitBall }
}
