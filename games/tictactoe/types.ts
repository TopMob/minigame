export type Player = 'X' | 'O'

export type CellValue = Player | null

export type Board = CellValue[]

export type GameMode = 'vs-bot' | 'pvp-local'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type GameStatus = 'in_progress' | 'won' | 'draw'

export type WinningLine = [number, number, number]

export interface ScoreBoard {
  x: number
  o: number
  draws: number
}

export interface TicTacToeState {
  board: Board
  turn: Player
  playerSign: Player
  mode: GameMode
  difficulty: Difficulty
  status: GameStatus
  winner: Player | null
  winningLine: WinningLine | null
  moveCount: number
  scores: ScoreBoard
  startTime: number | null
  isBotThinking: boolean
}

export type TicTacToeAction =
  | { type: 'MAKE_MOVE'; index: number }
  | { type: 'BOT_MOVE'; index: number }
  | { type: 'RESET_GAME' }
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SET_PLAYER_SIGN'; sign: Player }
