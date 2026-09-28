'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Undo2, Volume2, VolumeX, Trophy, Bot, Users, Sparkles, HelpCircle } from 'lucide-react'
import { useReversi } from '@/games/reversi/hooks'
import { soundManager } from '@/lib/audio/sounds'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/games/Confetti'
import { ReversiBoard } from './ReversiBoard'
import type { ReversiDifficulty } from '@/games/reversi/types'

const DIFFICULTIES: { id: ReversiDifficulty; label: string; desc: string }[] = [
  { id: 'easy', label: 'Лёгкий', desc: 'Случайные и жадные ходы' },
  { id: 'medium', label: 'Средний', desc: 'Minimax 3-го уровня + позиция' },
  { id: 'hard', label: 'Сложный', desc: 'Глубокий Minimax 5-го уровня + эндшпиль' },
]

export function ReversiGame() {
  const {
    state,
    makeMove,
    restart,
    undo,
    setDifficulty,
    setMode,
    setHumanPlayer,
  } = useReversi()

  const [muted, setMuted] = useState(soundManager.isMuted)
  const [showRules, setShowRules] = useState(false)

  const toggleMute = () => {
    setMuted(soundManager.toggleMute())
  }

  const isWon = state.status === 'won'
  const isDraw = state.status === 'draw'
  const isOver = isWon || isDraw
  const isHumanWin = state.mode === 'vs-bot' && state.winner === state.humanPlayer

  const totalDiscs = state.pieces.black + state.pieces.white
  const blackPct = totalDiscs > 0 ? (state.pieces.black / totalDiscs) * 100 : 50
  const whitePct = 100 - blackPct

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-xl mx-auto px-4 py-2 select-none">
      {isHumanWin && <Confetti />}

      {/* Шапка игры */}
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">⚫ Реверси</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Отелло</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Захватывай фишки противника между своими и удерживай углы!
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowRules(!showRules)}
            className="h-8 w-8 cursor-pointer"
            title="Правила игры"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 cursor-pointer"
            title={muted ? 'Включить звук' : 'Выключить звук'}
          >
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={state.history.length === 0 || isOver || state.isBotThinking}
            className="h-8 w-8 cursor-pointer disabled:opacity-40"
            title="Отменить ход"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            className="h-8 w-8 cursor-pointer"
            title="Новая партия"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Панель настроек: Режим и сложность */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center w-full bg-card/60 p-2 rounded-xl border border-border/60">
        {/* Режим: Бот / Вдвоем */}
        <div className="flex gap-1 bg-muted/60 p-0.5 rounded-lg">
          <button
            onClick={() => setMode('vs-bot')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              state.mode === 'vs-bot'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            Против бота
          </button>
          <button
            onClick={() => setMode('pvp-local')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              state.mode === 'pvp-local'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Вдвоём
          </button>
        </div>

        {/* Сложность бота */}
        {state.mode === 'vs-bot' ? (
          <div className="flex gap-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                  state.difficulty === d.id
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                    : 'border-border/60 text-muted-foreground hover:text-foreground'
                }`}
                title={d.desc}
              >
                {d.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground font-medium">
            Игра за одним экраном
          </div>
        )}
      </div>

      {/* Выбор цвета игрока (только против бота) */}
      {state.mode === 'vs-bot' && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Твой цвет:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setHumanPlayer('black')}
              className={`px-3 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer ${
                state.humanPlayer === 'black'
                  ? 'bg-neutral-900 text-white border-neutral-700 shadow-xs font-bold'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚫ Чёрные (первый ход)
            </button>
            <button
              onClick={() => setHumanPlayer('white')}
              className={`px-3 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer ${
                state.humanPlayer === 'white'
                  ? 'bg-neutral-100 text-black border-neutral-300 shadow-xs font-bold'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚪ Белые
            </button>
          </div>
        </div>
      )}

      {/* Информационное табло счёта */}
      <div className="w-full flex flex-col gap-2 bg-card border border-border rounded-xl p-3 shadow-xs">
        <div className="flex items-center justify-between">
          {/* Чёрные */}
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all ${
            state.currentPlayer === 'black' && !isOver
              ? 'ring-2 ring-primary/80 bg-primary/5'
              : 'opacity-80'
          }`}>
            <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[10px] text-white font-bold shadow-xs">
              ⚫
            </div>
            <div>
              <div className="text-[11px] font-semibold flex items-center gap-1">
                Чёрные
                {state.mode === 'vs-bot' && (
                  <span className="text-[9px] text-muted-foreground">
                    {state.humanPlayer === 'black' ? '(ты)' : '(бот)'}
                  </span>
                )}
              </div>
              <div className="text-lg font-black leading-none">{state.pieces.black}</div>
            </div>
          </div>

          {/* Статус хода в центре */}
          <div className="text-center">
            {isOver ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                Игра завершена
              </span>
            ) : state.isBotThinking ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Бот думает...
              </span>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                Ходят:{' '}
                <strong className="text-foreground">
                  {state.currentPlayer === 'black' ? 'Чёрные' : 'Белые'}
                </strong>
              </span>
            )}
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Свободно: {64 - totalDiscs}
            </div>
          </div>

          {/* Белые */}
          <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all ${
            state.currentPlayer === 'white' && !isOver
              ? 'ring-2 ring-primary/80 bg-primary/5'
              : 'opacity-80'
          }`}>
            <div className="text-right">
              <div className="text-[11px] font-semibold flex items-center justify-end gap-1">
                {state.mode === 'vs-bot' && (
                  <span className="text-[9px] text-muted-foreground">
                    {state.humanPlayer === 'white' ? '(ты)' : '(бот)'}
                  </span>
                )}
                Белые
              </div>
              <div className="text-lg font-black leading-none">{state.pieces.white}</div>
            </div>
            <div className="w-5 h-5 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center text-[10px] text-black font-bold shadow-xs">
              ⚪
            </div>
          </div>
        </div>

        {/* Шкала владения полем */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-neutral-900 dark:bg-neutral-800 transition-all duration-300"
            style={{ width: `${blackPct}%` }}
          />
          <div
            className="h-full bg-neutral-200 dark:bg-neutral-300 transition-all duration-300"
            style={{ width: `${whitePct}%` }}
          />
        </div>
      </div>

      {/* Оповещение о пропуске хода (Pass) */}
      <AnimatePresence>
        {state.passMessage && !isOver && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold text-center flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {state.passMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Игровая доска Реверси */}
      <ReversiBoard
        board={state.board}
        validMoves={state.validMoves}
        lastMove={state.lastMove}
        recentFlips={state.recentFlips}
        isThinking={state.isBotThinking}
        onMove={makeMove}
      />

      {/* Модальное окно завершения партии */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[460px] p-5 rounded-2xl bg-card border-2 border-primary/40 shadow-xl flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl text-primary">
              <Trophy className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-black">
                {isDraw
                  ? 'Ничья!'
                  : state.mode === 'vs-bot'
                  ? isHumanWin
                    ? '🎉 Победа!'
                    : 'Поражение'
                  : state.winner === 'black'
                  ? 'Победа Чёрных!'
                  : 'Победа Белых!'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Финальный счёт:{' '}
                <span className="font-bold text-foreground">
                  ⚫ {state.pieces.black} : {state.pieces.white} ⚪
                </span>
              </p>
            </div>

            <div className="flex gap-2 mt-2 w-full max-w-xs">
              <Button onClick={restart} className="w-full gap-2 cursor-pointer font-bold">
                <RotateCcw className="h-4 w-4" />
                Играть снова
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Блок правил игры (раскрывающийся) */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-muted/40 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-2 overflow-hidden"
          >
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>📖</span> Правила игры Реверси (Отелло):
            </div>
            <p>
              1. <strong>Цель:</strong> закончить игру с наибольшим числом фишек своего цвета.
            </p>
            <p>
              2. <strong>Ход:</strong> ставить фишку можно только в клетку, которая зажимает одну или несколько фишек противника между вашей новой фишкой и любой уже стоящей вашей фишкой по горизонтали, вертикали или диагонали.
            </p>
            <p>
              3. <strong>Переворот:</strong> все зажатые фишки противника меняют цвет на ваш.
            </p>
            <p>
              4. <strong>Пропуск хода:</strong> если у игрока нет допустимых ходов, ход переходит сопернику.
            </p>
            <p>
              5. <strong>Стратегия:</strong> угловые клетки поля невозможно перевернуть до конца игры — захватывайте углы и избегайте клеток, прилегающих к ним в начале игры!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
