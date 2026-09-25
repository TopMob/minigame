import type { GameEngine } from '@/games/_lib/types'
import { checkBoardWinner, getAvailableMoves } from './ai'
import type { Difficulty, GameMode, Player, TicTacToeAction, TicTacToeState } from './types'

export interface TicTacToeOptions {
  mode?: GameMode
  difficulty?: Difficulty
  playerSign?: Player
}

export function createInitialState(options: TicTacToeOptions = {}): TicTacToeState {
  const mode = options.mode ?? 'vs-bot'
  const difficulty = options.difficulty ?? 'medium'
  const playerSign = options.playerSign ?? 'X'

  const isBotThinking = mode === 'vs-bot' && playerSign === 'O'

  return {
    board: Array(9).fill(null),
    turn: 'X',
    playerSign,
    mode,
    difficulty,
    status: 'in_progress',
    winner: null,
    winningLine: null,
    moveCount: 0,
    scores: { x: 0, o: 0, draws: 0 },
    startTime: null,
    isBotThinking,
  }
}

export class TicTacToeEngine implements GameEngine<TicTacToeState, TicTacToeAction, TicTacToeOptions> {
  createInitialState(opts: TicTacToeOptions = {}): TicTacToeState {
    return createInitialState(opts)
  }

  isValidAction(state: TicTacToeState, action: TicTacToeAction): boolean {
    if (action.type === 'RESET_GAME' || action.type === 'SET_MODE' || action.type === 'SET_DIFFICULTY' || action.type === 'SET_PLAYER_SIGN') {
      return true
    }

    if (state.status !== 'in_progress') {
      return false
    }

    if (action.type === 'MAKE_MOVE' || action.type === 'BOT_MOVE') {
      const { index } = action
      return index >= 0 && index < 9 && state.board[index] === null
    }

    return false
  }

  applyAction(state: TicTacToeState, action: TicTacToeAction): TicTacToeState {
    switch (action.type) {
      case 'SET_MODE': {
        return {
          ...createInitialState({
            mode: action.mode,
            difficulty: state.difficulty,
            playerSign: state.playerSign,
          }),
          scores: { x: 0, o: 0, draws: 0 },
        }
      }

      case 'SET_DIFFICULTY': {
        return {
          ...state,
          difficulty: action.difficulty,
        }
      }

      case 'SET_PLAYER_SIGN': {
        return {
          ...createInitialState({
            mode: state.mode,
            difficulty: state.difficulty,
            playerSign: action.sign,
          }),
          scores: { x: 0, o: 0, draws: 0 },
        }
      }

      case 'RESET_GAME': {
        return {
          ...state,
          board: Array(9).fill(null),
          turn: 'X',
          status: 'in_progress',
          winner: null,
          winningLine: null,
          moveCount: 0,
          startTime: null,
          isBotThinking: state.mode === 'vs-bot' && state.playerSign === 'O',
        }
      }

      case 'MAKE_MOVE':
      case 'BOT_MOVE': {
        if (!this.isValidAction(state, action)) return state

        const newBoard = [...state.board]
        newBoard[action.index] = state.turn

        const { winner, line } = checkBoardWinner(newBoard)
        const available = getAvailableMoves(newBoard)
        const isDraw = !winner && available.length === 0
        const newMoveCount = state.moveCount + 1

        let newStatus: TicTacToeState['status'] = 'in_progress'
        const newScores = { ...state.scores }

        if (winner) {
          newStatus = 'won'
          if (winner === 'X') newScores.x += 1
          else newScores.o += 1
        } else if (isDraw) {
          newStatus = 'draw'
          newScores.draws += 1
        }

        const nextTurn: Player = state.turn === 'X' ? 'O' : 'X'

        const willBotMove =
          action.type === 'MAKE_MOVE' &&
          state.mode === 'vs-bot' &&
          newStatus === 'in_progress'

        return {
          ...state,
          board: newBoard,
          turn: nextTurn,
          status: newStatus,
          winner,
          winningLine: line,
          moveCount: newMoveCount,
          scores: newScores,
          startTime: state.startTime ?? Date.now(),
          isBotThinking: willBotMove,
        }
      }

      default:
        return state
    }
  }

  isGameOver(state: TicTacToeState): boolean {
    return state.status !== 'in_progress'
  }

  getScore(state: TicTacToeState): number {
    if (state.winner) {
      // Больше очков за победу меньшим числом ходов
      return Math.max(100 - state.moveCount * 5, 50)
    }
    if (state.status === 'draw') {
      return 25
    }
    return 0
  }
}

export const ticTacToeEngine = new TicTacToeEngine()
