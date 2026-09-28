'use client'

// Главный компонент игры 4 в ряд

import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Volume2, VolumeX, Bot, Users } from 'lucide-react'
import { useState } from 'react'
import { useConnect4 } from '@/games/connect4/hooks'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/games/Confetti'
import { soundManager } from '@/lib/audio/sounds'
import { Connect4Board } from './Connect4Board'
import type { Connect4Difficulty, Connect4Player } from '@/games/connect4/types'

const DIFFICULTIES: { id: Connect4Difficulty; label: string }[] = [
  { id: 'easy', label: 'Лёгкий' },
  { id: 'medium', label: 'Средний' },
  { id: 'hard', label: 'Сложный' },
]

const PLAYER_NAMES: Record<Connect4Player, string> = {
  red: '🔴 Красный',
  yellow: '🟡 Жёлтый',
}

const PLAYER_COLORS: Record<Connect4Player, string> = {
  red: 'text-red-500',
  yellow: 'text-yellow-500',
}

export function Connect4Game() {
  const { state, drop, resetGame, setMode, setDifficulty, setHumanPlayer } = useConnect4()
  const [muted, setMuted] = useState(soundManager.isMuted)
  const toggleMute = () => setMuted(soundManager.toggleMute())

  const isWon = state.status === 'won'
  const isDraw = state.status === 'draw'
  const isOver = isWon || isDraw
  const isUserWin = state.mode === 'vs-bot' && isWon && state.winner === state.humanPlayer

  const disabled = isOver || state.isBotThinking ||
    (state.mode === 'vs-bot' && state.currentPlayer !== state.humanPlayer)

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-2xl mx-auto px-4 py-2 select-none">
      {isUserWin && <Confetti />}

      {/* Заголовок */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">🔴 Четыре в ряд</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Соберите 4 фишки подряд — по горизонтали, вертикали или диагонали
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 cursor-pointer">
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={resetGame} className="h-8 w-8 cursor-pointer" title="Новая игра">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Режим игры */}
      <div className="flex rounded-2xl border border-border bg-muted/40 p-1 w-full max-w-xs">
        <button
          onClick={() => setMode('vs-bot')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            state.mode === 'vs-bot' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="h-3.5 w-3.5" /> С ботом
        </button>
        <button
          onClick={() => setMode('pvp-local')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            state.mode === 'pvp-local' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-3.5 w-3.5" /> Вдвоём
        </button>
      </div>

      {/* Настройки бота */}
      {state.mode === 'vs-bot' && (
        <div className="flex flex-wrap gap-2 items-center justify-center">
          <div className="flex gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
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
              onClick={() => setHumanPlayer('red')}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                state.humanPlayer === 'red'
                  ? 'border-red-500 bg-red-500/10 text-red-500'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Играть 🔴
            </button>
            <button
              onClick={() => setHumanPlayer('yellow')}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                state.humanPlayer === 'yellow'
                  ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              Играть 🟡
            </button>
          </div>
        </div>
      )}

      {/* Счёт */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">
            {state.mode === 'vs-bot' && state.humanPlayer === 'red' ? 'Ты' : '🔴'}
          </div>
          <div className="text-2xl font-black text-red-500">{state.scores.red}</div>
        </div>
        <div className="text-muted-foreground text-lg font-bold">:</div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase font-medium">
            {state.mode === 'vs-bot' && state.humanPlayer === 'yellow' ? 'Ты' : (state.mode === 'vs-bot' ? 'Бот' : '🟡')}
          </div>
          <div className="text-2xl font-black text-yellow-500">{state.scores.yellow}</div>
        </div>
      </div>

      {/* Статус хода */}
      {!isOver && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className={`w-3 h-3 rounded-full ${state.currentPlayer === 'red' ? 'bg-red-500' : 'bg-yellow-400'}`} />
          <span className={PLAYER_COLORS[state.currentPlayer]}>
            {state.isBotThinking
              ? '🤖 Бот думает...'
              : state.mode === 'pvp-local'
                ? `Ход: ${PLAYER_NAMES[state.currentPlayer]}`
                : state.currentPlayer === state.humanPlayer
                  ? 'Ваш ход'
                  : '🤖 Бот думает...'}
          </span>
        </div>
      )}

      {/* Поле */}
      <Connect4Board
        board={state.board}
        winningCells={state.winningCells}
        currentPlayer={state.currentPlayer}
        disabled={disabled}
        onDrop={drop}
      />

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
                : isUserWin || (state.mode === 'pvp-local' && isWon)
                  ? 'bg-emerald-500/10 border-emerald-500/40'
                  : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="text-4xl mb-2">
              {isDraw ? '🤝' : isUserWin || (state.mode === 'pvp-local' && isWon) ? '🎉' : '😔'}
            </div>
            <div className="text-xl font-black">
              {isDraw
                ? 'Ничья!'
                : state.mode === 'pvp-local' && state.winner
                  ? `Победил ${PLAYER_NAMES[state.winner]}!`
                  : isUserWin
                    ? 'Вы победили!'
                    : 'Бот победил!'}
            </div>
            <Button onClick={resetGame} className="mt-4 cursor-pointer" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" /> Ещё раз
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
