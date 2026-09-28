'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Bot,
  Users,
  Trophy,
  ArrowUpDown,
  Sparkles,
  Swords,
} from 'lucide-react'
import { ChessBoard } from './ChessBoard'
import { ChessPiece } from './ChessPieces'
import { Confetti } from '../Confetti'
import { useChess } from '@/games/chess/hooks'
import { soundManager } from '@/lib/audio/sounds'
import type {
  ChessColor,
  ChessDifficulty,
  GameMode,
} from '@/games/chess/types'

const DIFFICULTY_LABELS: Record<ChessDifficulty, string> = {
  easy: 'Новичок',
  medium: 'Любитель',
  hard: 'Мастер',
  expert: 'Гроссмейстер',
}

export const ChessGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<ChessDifficulty>('medium')
  const [gameMode, setGameMode] = useState<GameMode>('ai')
  const [playerColor, setPlayerColor] = useState<ChessColor>('w')
  const [isFlipped, setIsFlipped] = useState(false)
  const [isMuted, setIsMuted] = useState(soundManager.isMuted)

  const {
    state,
    handleSquareClick,
    handlePromotionSelect,
    cancelPromotion,
    restart,
    undo,
  } = useChess(difficulty, gameMode, playerColor)

  const historyEndRef = useRef<HTMLDivElement>(null)

  // Автоскролл списка ходов
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.history])

  const toggleSound = () => {
    const nextMuted = soundManager.toggleMute()
    setIsMuted(nextMuted)
  }

  const handleDifficultyChange = (newDiff: ChessDifficulty) => {
    setDifficulty(newDiff)
    restart(newDiff, gameMode, playerColor)
  }

  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode)
    restart(difficulty, newMode, playerColor)
  }

  const handleColorChange = (newColor: ChessColor) => {
    setPlayerColor(newColor)
    setIsFlipped(newColor === 'b')
    restart(difficulty, gameMode, newColor)
  }

  // Группировка истории по парам (ход белых, ход чёрных)
  const movePairs: { num: number; white?: string; black?: string }[] = []
  for (let i = 0; i < state.history.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: state.history[i]?.san,
      black: state.history[i + 1]?.san,
    })
  }

  const isGameOver = state.status !== 'in_progress'
  const isHumanWin = state.gameMode === 'ai' && state.winner === state.playerColor
  const isDraw = state.winner === 'draw'

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 space-y-4">
      {/* Шапка: режим, сложность и кнопки действий */}
      <div className="flex flex-wrap items-center justify-between w-full gap-2 p-3 bg-slate-900/60 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-md">
        {/* Выбор режима (AI / PvP) */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleModeChange('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              gameMode === 'ai'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Против ИИ</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('pvp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              gameMode === 'pvp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Вдвоём</span>
          </button>
        </div>

        {/* Выбор цвета и сложности (только для режима AI) */}
        {gameMode === 'ai' && (
          <div className="flex items-center gap-2">
            {/* Цвет */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleColorChange('w')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  playerColor === 'w'
                    ? 'bg-slate-200 text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚪ Белые
              </button>
              <button
                type="button"
                onClick={() => handleColorChange('b')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  playerColor === 'b'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚫ Чёрные
              </button>
            </div>

            {/* Сложность */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl">
              {(['easy', 'medium', 'hard', 'expert'] as ChessDifficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDifficultyChange(d)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    difficulty === d
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Управление (Звук, Переворот, Сброс) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setIsFlipped((prev) => !prev)}
            title="Перевернуть доску"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleSound}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => restart()}
            title="Новая партия"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Заново</span>
          </button>
        </div>
      </div>

      {/* Основной блок: Доска слева, Панель справа */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center w-full gap-6">
        {/* Колонка с доской и захваченными фигурами */}
        <div className="flex flex-col items-center w-full max-w-[540px] space-y-2">
          {/* Верхняя панель захваченных фигур (фигуры верхнего игрока) */}
          <div className="flex items-center justify-between w-full px-3 py-1.5 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-300">
                {isFlipped ? '⚪ Белые' : '⚫ Чёрные'}
              </span>
              {/* Показ бота */}
              {gameMode === 'ai' &&
                (isFlipped ? playerColor === 'b' : playerColor === 'w') && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Бот ({DIFFICULTY_LABELS[difficulty]})
                  </span>
                )}
            </div>

            {/* Фигуры, взятые верхним игроком */}
            <div className="flex items-center gap-0.5">
              {(isFlipped ? state.captured.w : state.captured.b).map((p, idx) => (
                <div key={idx} className="w-5 h-5 -ml-1">
                  <ChessPiece type={p} color={isFlipped ? 'w' : 'b'} />
                </div>
              ))}
              {/* Материальное преимущество */}
              {((isFlipped ? -state.materialAdvantage : state.materialAdvantage) > 0) && (
                <span className="ml-1 text-[11px] font-bold text-emerald-400">
                  +{isFlipped ? -state.materialAdvantage : state.materialAdvantage}
                </span>
              )}
            </div>
          </div>

          {/* Интерактивная доска */}
          <ChessBoard
            fen={state.fen}
            isFlipped={isFlipped}
            selectedSquare={state.selectedSquare}
            validMoves={state.validMoves}
            lastMove={state.lastMove}
            isCheck={state.isCheck}
            turn={state.turn}
            pendingPromotion={state.pendingPromotion}
            onSquareClick={handleSquareClick}
            onPromotionSelect={handlePromotionSelect}
            onCancelPromotion={cancelPromotion}
          />

          {/* Нижняя панель захваченных фигур (фигуры нижнего игрока) */}
          <div className="flex items-center justify-between w-full px-3 py-1.5 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-300">
                {isFlipped ? '⚫ Чёрные' : '⚪ Белые'}
              </span>
              {gameMode === 'ai' &&
                (isFlipped ? playerColor === 'w' : playerColor === 'b') && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Бот ({DIFFICULTY_LABELS[difficulty]})
                  </span>
                )}
            </div>

            <div className="flex items-center gap-0.5">
              {(isFlipped ? state.captured.b : state.captured.w).map((p, idx) => (
                <div key={idx} className="w-5 h-5 -ml-1">
                  <ChessPiece type={p} color={isFlipped ? 'b' : 'w'} />
                </div>
              ))}
              {((isFlipped ? state.materialAdvantage : -state.materialAdvantage) > 0) && (
                <span className="ml-1 text-[11px] font-bold text-emerald-400">
                  +{isFlipped ? state.materialAdvantage : -state.materialAdvantage}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Боковая панель: Статус партии, История ходов, Кнопки */}
        <div className="flex flex-col w-full max-w-[540px] lg:w-72 lg:max-w-none bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-4">
          {/* Индикатор статуса */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center gap-2">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 ${
                  state.turn === 'w'
                    ? 'bg-white border-slate-400'
                    : 'bg-slate-950 border-slate-600'
                }`}
              />
              <span className="text-xs font-bold text-slate-200">
                {state.status === 'in_progress' ? (
                  state.isBotThinking ? (
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      ИИ думает...
                    </span>
                  ) : (
                    `Ход ${state.turn === 'w' ? 'белых' : 'чёрных'}`
                  )
                ) : state.status === 'checkmate' ? (
                  'МАТ!'
                ) : (
                  'НИЧЬЯ'
                )}
              </span>
            </div>

            {state.isCheck && state.status === 'in_progress' && (
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                Шах!
              </span>
            )}
          </div>

          {/* История ходов */}
          <div className="flex flex-col flex-1 min-h-[220px] max-h-[340px] bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
              <span>Ходы партии</span>
              <span className="text-[10px] font-normal text-slate-500">
                Всего: {state.history.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
              {movePairs.length === 0 ? (
                <div className="text-center text-slate-600 py-8 text-xs italic">
                  Ходов пока нет
                </div>
              ) : (
                movePairs.map((pair) => (
                  <div
                    key={pair.num}
                    className="grid grid-cols-5 py-0.5 px-2 rounded hover:bg-slate-900/60 text-slate-300"
                  >
                    <span className="col-span-1 text-slate-500">{pair.num}.</span>
                    <span className="col-span-2 font-medium text-slate-200">{pair.white}</span>
                    <span className="col-span-2 font-medium text-slate-400">{pair.black || ''}</span>
                  </div>
                ))
              )}
              <div ref={historyEndRef} />
            </div>
          </div>

          {/* Кнопка отмены хода */}
          <button
            type="button"
            onClick={undo}
            disabled={state.history.length === 0 || state.isBotThinking}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Вернуть ход назад</span>
          </button>
        </div>
      </div>

      {/* Оверлей победы / завершения игры */}
      {isGameOver && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          {isHumanWin && <Confetti />}

          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 flex items-center justify-center border border-amber-500/30">
              {isHumanWin ? (
                <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
              ) : isDraw ? (
                <Sparkles className="w-8 h-8 text-cyan-400" />
              ) : (
                <Swords className="w-8 h-8 text-rose-400" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                {isHumanWin
                  ? 'Блестящая победа!'
                  : isDraw
                  ? 'Ничья!'
                  : state.gameMode === 'ai'
                  ? 'Поражение'
                  : `Победили ${state.winner === 'w' ? 'Белые' : 'Чёрные'}!`}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {state.status === 'checkmate'
                  ? `Мат ${state.turn === 'w' ? 'белому' : 'чёрному'} королю`
                  : state.status === 'stalemate'
                  ? 'Пат — у игрока нет допустимых ходов'
                  : state.status === 'threefold'
                  ? 'Ничья по троекратному повторению позиции'
                  : state.status === 'insufficient'
                  ? 'Ничья: недостаточно материала для мата'
                  : 'Партия завершилась вничью'}
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Ходов сделано:</span>
                <span className="font-bold text-white">{state.history.length}</span>
              </div>
              {gameMode === 'ai' && (
                <div className="flex justify-between">
                  <span>Сложность:</span>
                  <span className="font-bold text-emerald-400">
                    {DIFFICULTY_LABELS[difficulty]}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => restart()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
            >
              Сыграть ещё раз
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
