'use client'

// Главный компонент игры Шашки

import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Volume2, VolumeX, Crown, Bot, Users } from 'lucide-react'
import { useState } from 'react'
import { useCheckers } from '@/games/checkers/hooks'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/games/Confetti'
import { soundManager } from '@/lib/audio/sounds'
import { BOARD_SIZE } from '@/games/checkers/engine'
import type { CheckersDifficulty, CheckersPlayer } from '@/games/checkers/types'

const DIFFICULTIES: { id: CheckersDifficulty; label: string }[] = [
  { id: 'easy', label: 'Лёгкий' },
  { id: 'medium', label: 'Средний' },
  { id: 'hard', label: 'Сложный' },
]

const PLAYER_LABELS: Record<CheckersPlayer, string> = {
  black: 'Чёрные',
  white: 'Белые',
}

export function CheckersGame() {
  const { state, handleCellClick, restart, setDifficulty, setHumanPlayer, setGameMode } = useCheckers()
  const [muted, setMuted] = useState(soundManager.isMuted)
  const toggleMute = () => setMuted(soundManager.toggleMute())

  const isWon = state.status === 'won'
  const isDraw = state.status === 'draw'
  const isOver = isWon || isDraw
  const isUserWin = state.gameMode === 'ai' ? (isWon && state.winner === state.humanPlayer) : false
  const botPlayer: CheckersPlayer = state.humanPlayer === 'black' ? 'white' : 'black'

  const isLightCell = (r: number, c: number) => (r + c) % 2 === 0

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-xl mx-auto px-4 py-2 select-none">
      {((state.gameMode === 'ai' && isUserWin) || (state.gameMode === 'pvp' && isWon)) && <Confetti />}

      {/* Заголовок */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">🏁 Шашки</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Русские правила — обязательное взятие, дамки, цепочные прыжки
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 cursor-pointer">
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => restart()} className="h-8 w-8 cursor-pointer" title="Новая игра">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Настройки режима */}
      <div className="flex flex-wrap gap-2.5 justify-center items-center">
        {/* Переключатель AI / PvP */}
        <div className="flex items-center gap-1 bg-stone-900/60 p-1 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => setGameMode('ai')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              state.gameMode === 'ai'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Против ИИ</span>
          </button>
          <button
            type="button"
            onClick={() => setGameMode('pvp')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              state.gameMode === 'pvp'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Вдвоём</span>
          </button>
        </div>

        {/* Настройки для режима AI */}
        {state.gameMode === 'ai' && (
          <>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    state.difficulty === d.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setHumanPlayer('white')}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  state.humanPlayer === 'white'
                    ? 'border-stone-300 bg-stone-100/10 text-foreground font-bold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                ⬜ Белые
              </button>
              <button
                onClick={() => setHumanPlayer('black')}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  state.humanPlayer === 'black'
                    ? 'border-stone-700 bg-stone-700/20 text-foreground font-bold'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                ⬛ Чёрные
              </button>
            </div>
          </>
        )}
      </div>

      {/* Счёт и статус */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">
            ⬛ Чёрные {state.gameMode === 'ai' ? (state.humanPlayer === 'black' ? '(ты)' : '(бот)') : '(Игрок 2)'}
          </div>
          <div className="text-xl font-black">{state.pieces.black}<span className="text-muted-foreground text-xs font-normal"> шт</span></div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">Победы</div>
          <div className="text-sm font-bold">{state.scores.black} : {state.scores.white}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">
            ⬜ Белые {state.gameMode === 'ai' ? (state.humanPlayer === 'white' ? '(ты)' : '(бот)') : '(Игрок 1)'}
          </div>
          <div className="text-xl font-black">{state.pieces.white}<span className="text-muted-foreground text-xs font-normal"> шт</span></div>
        </div>
      </div>

      {/* Статус хода */}
      {!isOver && (
        <div className="text-sm font-semibold tracking-wide">
          {state.gameMode === 'pvp' ? (
            state.currentPlayer === 'white' ? (
              <span className="text-stone-200">Ход белых ⚪</span>
            ) : (
              <span className="text-stone-400">Ход чёрных ⚫</span>
            )
          ) : (
            <span className="text-muted-foreground">
              {state.isBotThinking
                ? '🤖 Бот думает...'
                : state.currentPlayer === state.humanPlayer
                  ? `Ваш ход (${PLAYER_LABELS[state.humanPlayer]})`
                  : `Ход бота (${PLAYER_LABELS[botPlayer]})`}
            </span>
          )}
        </div>
      )}

      {/* Доска */}
      <div
        className="rounded-2xl overflow-hidden border-4 border-amber-900/60 shadow-2xl"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
      >
        {Array.from({ length: BOARD_SIZE }, (_, row) =>
          Array.from({ length: BOARD_SIZE }, (_, col) => {
            const piece = state.board[row][col]
            const isLight = isLightCell(row, col)
            const isSelected = state.selectedCell?.[0] === row && state.selectedCell?.[1] === col
            const isValidTarget = state.validMoves.some(m => m.to[0] === row && m.to[1] === col)
            const isCapture = state.validMoves.some(m => m.to[0] === row && m.to[1] === col && m.captures.length > 0)

            return (
              <div
                key={`${row}-${col}`}
                onClick={() => !isLight && handleCellClick(row, col)}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center relative
                  ${isLight ? 'bg-amber-100 dark:bg-amber-100' : 'bg-amber-800 dark:bg-amber-900'}
                  ${!isLight && !isOver && (state.gameMode === 'pvp' || (!state.isBotThinking && state.currentPlayer === state.humanPlayer)) ? 'cursor-pointer' : ''}
                `}
              >
                {/* Подсветка выбранной */}
                {isSelected && (
                  <div className="absolute inset-0 bg-yellow-400/40 ring-2 ring-inset ring-yellow-400" />
                )}
                {/* Подсветка допустимых ходов */}
                {isValidTarget && !piece && (
                  <div className={`absolute inset-0 flex items-center justify-center ${isCapture ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                    <div className={`w-3 h-3 rounded-full ${isCapture ? 'bg-red-500/60' : 'bg-emerald-500/50'}`} />
                  </div>
                )}
                {isValidTarget && piece && (
                  <div className="absolute inset-0 bg-red-500/30 ring-2 ring-inset ring-red-500" />
                )}

                {/* Шашка */}
                {piece && (
                  <motion.div
                    layout
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-lg flex items-center justify-center relative z-10
                      ${piece.player === 'black'
                        ? 'bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600 text-white'
                        : 'bg-gradient-to-br from-stone-100 to-stone-300 border-2 border-stone-400 text-gray-700'}
                      ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-amber-800' : ''}
                    `}
                  >
                    {piece.type === 'king' && (
                      <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </motion.div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Результат */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className={`w-full max-w-sm rounded-3xl p-5 text-center border-2 ${
              isDraw
                ? 'bg-muted/30 border-muted-foreground/30'
                : (state.gameMode === 'pvp' || isUserWin)
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="text-4xl mb-2">{isDraw ? '🤝' : (state.gameMode === 'pvp' || isUserWin) ? '🏆' : '😔'}</div>
            <div className="text-xl font-black">
              {isDraw
                ? 'Ничья!'
                : state.gameMode === 'pvp'
                  ? (state.winner === 'white' ? 'Победили Белые! ⚪' : 'Победили Чёрные! ⚫')
                  : (isUserWin ? 'Вы победили!' : 'Бот победил!')}
            </div>
            <Button onClick={() => restart()} className="mt-4 cursor-pointer" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" /> Ещё раз
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Легенда */}
      <div className="text-[11px] text-muted-foreground text-center space-y-0.5">
        <p>Кликни на свою шашку, затем на подсвеченную клетку для хода</p>
        <p>🟩 Допустимый ход &nbsp;•&nbsp; 🔴 Взятие &nbsp;•&nbsp; 👑 Дамка</p>
      </div>
    </div>
  )
}
