'use client'

// ScoreOverlay — оверлей счёта и информации для игры Теннис
// Рендерится поверх canvas как DOM-слой

import { motion, AnimatePresence } from 'framer-motion'
import type { TennisState } from '@/games/tennis/types'
import { pointsToLabel, SETS_TO_WIN } from '@/games/tennis/types'

interface ScoreOverlayProps {
  state: TennisState
  onServe: () => void
}

export function ScoreOverlay({ state, onServe }: ScoreOverlayProps) {
  const { score, phase, pointWinner, faultReason, serveBy, matchWinner, matchOver } = state

  const playerPts = pointsToLabel(score.playerPoints)
  const opponentPts = pointsToLabel(score.opponentPoints)

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
      {/* ── Верхняя панель счёта ──────────────────────────────────────────────── */}
      <div className="absolute top-2 left-0 right-0 flex justify-center">
        <div className="flex items-stretch gap-1 bg-black/60 backdrop-blur-md rounded-xl px-2 py-1.5 border border-white/10">
          {/* Соперник */}
          <div className="flex flex-col items-center px-2.5 min-w-[42px]">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-red-400 opacity-80">Бот</span>
            {/* Сеты */}
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: SETS_TO_WIN }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < score.opponentSets ? 'bg-red-400' : 'bg-white/15'}`}
                />
              ))}
            </div>
            {/* Геймы */}
            <span className="text-lg font-bold font-mono text-white leading-tight">{score.opponentGames}</span>
          </div>

          {/* Разделитель + текущие очки */}
          <div className="flex flex-col items-center justify-center px-2 border-x border-white/15">
            <span className="text-[8px] text-white/40 uppercase tracking-wider">Очки</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-sm font-bold font-mono w-6 text-center ${opponentPts === 'A' ? 'text-red-400' : 'text-white'}`}>
                {opponentPts}
              </span>
              <span className="text-xs text-white/30">:</span>
              <span className={`text-sm font-bold font-mono w-6 text-center ${playerPts === 'A' ? 'text-blue-400' : 'text-white'}`}>
                {playerPts}
              </span>
            </div>
          </div>

          {/* Игрок */}
          <div className="flex flex-col items-center px-2.5 min-w-[42px]">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-400 opacity-80">Ты</span>
            <div className="flex gap-0.5 mt-0.5">
              {Array.from({ length: SETS_TO_WIN }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < score.playerSets ? 'bg-blue-400' : 'bg-white/15'}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold font-mono text-white leading-tight">{score.playerGames}</span>
          </div>
        </div>
      </div>

      {/* ── Индикатор подачи ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'serve' && (
          <motion.div
            key="serve-prompt"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-auto"
          >
            <button
              onClick={onServe}
              className="flex flex-col items-center gap-1 bg-white/10 hover:bg-white/18 active:scale-95 transition-all border border-white/20 rounded-2xl px-5 py-2.5 backdrop-blur-sm"
            >
              <span className="text-xl">🎾</span>
              <span className="text-sm font-semibold text-white">
                {serveBy === 'player' ? 'Нажмите — подача!' : 'Подача соперника...'}
              </span>
              <span className="text-[10px] text-white/50">
                {serveBy === 'player' ? 'Клик / тап по корту' : ''}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Уведомление о розыгрыше очка ──────────────────────────────────────── */}
      <AnimatePresence>
        {(phase === 'pointEnd' || matchOver) && pointWinner && (
          <motion.div
            key={`point-${score.playerPoints}-${score.opponentPoints}`}
            initial={{ opacity: 0, scale: 0.7, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={`
              rounded-2xl px-6 py-4 text-center shadow-2xl border
              ${pointWinner === 'player'
                ? 'bg-blue-600/90 border-blue-400/40 backdrop-blur-md'
                : 'bg-red-700/90 border-red-400/40 backdrop-blur-md'}
            `}>
              <div className="text-3xl mb-1">
                {pointWinner === 'player' ? '🎾' : '😤'}
              </div>
              <div className="text-white font-bold text-lg">
                {pointWinner === 'player' ? 'Ваше очко!' : 'Очко бота!'}
              </div>
              {faultReason && (
                <div className="text-white/70 text-xs mt-1">
                  {faultReason === 'net' ? '🕸 В сетку' : '📍 Аут'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Конец матча ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {matchOver && matchWinner && (
          <motion.div
            key="match-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.6, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 1.4 }}
              className={`rounded-3xl px-8 py-6 text-center shadow-2xl border-2 ${
                matchWinner === 'player'
                  ? 'bg-blue-700/95 border-blue-300/50'
                  : 'bg-red-800/95 border-red-400/50'
              }`}
            >
              <div className="text-4xl mb-2">
                {matchWinner === 'player' ? '🏆' : '😔'}
              </div>
              <div className="text-white font-extrabold text-2xl">
                {matchWinner === 'player' ? 'Победа!' : 'Поражение'}
              </div>
              <div className="text-white/70 text-sm mt-1 mb-3">
                Счёт: {score.playerSets} : {score.opponentSets} сет(а/ов)
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
