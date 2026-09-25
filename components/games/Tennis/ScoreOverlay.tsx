'use client'

// ScoreOverlay — оверлей счёта и уведомлений для игры Теннис (3D от первого лица)

import { motion, AnimatePresence } from 'framer-motion'
import type { TennisUIState } from '@/games/tennis/hooks'
import { pointsToLabel, SETS_TO_WIN } from '@/games/tennis/types'

interface ScoreOverlayProps {
  state: TennisUIState
  onServe: () => void
}

export function ScoreOverlay({ state, onServe }: ScoreOverlayProps) {
  const { score, phase, pointWinner, faultReason, serveBy, matchWinner, matchOver, rallyCount, isSmash } = state

  const playerPts = pointsToLabel(score.playerPoints)
  const opponentPts = pointsToLabel(score.opponentPoints)

  function getFaultText(reason: typeof faultReason): string {
    switch (reason) {
      case 'net':
        return '🕸 В сетку'
      case 'out':
        return '📍 Аут'
      case 'double_bounce':
        return '⚡ Двойной отскок'
      case 'miss':
        return '💨 Промах'
      default:
        return ''
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 5 }}>
      {/* ── Верхняя панель счёта ──────────────────────────────────────────────── */}
      <div className="absolute top-2 left-0 right-0 flex flex-col items-center gap-1.5">
        <div className="flex items-stretch gap-1 bg-black/70 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/15 shadow-xl">
          {/* Соперник */}
          <div className="flex flex-col items-center px-2.5 min-w-[42px]">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-red-400 opacity-90">Бот</span>
            {/* Сеты */}
            <div className="flex gap-1 mt-0.5">
              {Array.from({ length: SETS_TO_WIN }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < score.opponentSets ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-white/20'}`}
                />
              ))}
            </div>
            {/* Геймы */}
            <span className="text-lg font-bold font-mono text-white leading-tight">{score.opponentGames}</span>
          </div>

          {/* Разделитель + текущие очки */}
          <div className="flex flex-col items-center justify-center px-3 border-x border-white/15">
            <span className="text-[8px] text-white/50 uppercase tracking-wider">Очки</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-base font-extrabold font-mono w-6 text-center ${opponentPts === 'A' ? 'text-red-400' : 'text-white'}`}>
                {opponentPts}
              </span>
              <span className="text-xs text-white/30">:</span>
              <span className={`text-base font-extrabold font-mono w-6 text-center ${playerPts === 'A' ? 'text-blue-400' : 'text-white'}`}>
                {playerPts}
              </span>
            </div>
          </div>

          {/* Игрок */}
          <div className="flex flex-col items-center px-2.5 min-w-[42px]">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-400 opacity-90">Ты</span>
            <div className="flex gap-1 mt-0.5">
              {Array.from({ length: SETS_TO_WIN }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i < score.playerSets ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-white/20'}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold font-mono text-white leading-tight">{score.playerGames}</span>
          </div>
        </div>

        {/* Счётчик ударов во время розыгрыша */}
        {phase === 'rally' && rallyCount > 1 && (
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-0.5 border border-white/10 text-[10px] text-white/80 font-medium">
            Ударов: <span className="font-bold text-amber-300">{rallyCount}</span>
          </div>
        )}

        {/* Индикатор Смэша */}
        {isSmash && phase === 'rally' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-amber-500/90 text-black font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-lg"
          >
            ⚡ СМЭШ!
          </motion.div>
        )}
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
            className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-auto"
          >
            <button
              onClick={onServe}
              className="flex flex-col items-center gap-1 bg-blue-600/90 hover:bg-blue-500 active:scale-95 transition-all border border-blue-300/40 rounded-2xl px-6 py-3 shadow-xl backdrop-blur-md cursor-pointer"
            >
              <span className="text-2xl animate-bounce">🏓</span>
              <span className="text-sm font-bold text-white tracking-wide">
                {serveBy === 'player' ? 'НАЖМИ — ПОДАЧА!' : 'Подача соперника...'}
              </span>
              <span className="text-[10px] text-blue-100/70">
                {serveBy === 'player' ? 'Клик / тап по столу' : ''}
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
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className={`
              rounded-2xl px-6 py-4 text-center shadow-2xl border
              ${pointWinner === 'player'
                ? 'bg-blue-600/90 border-blue-300/50 backdrop-blur-md'
                : 'bg-red-700/90 border-red-300/50 backdrop-blur-md'}
            `}>
              <div className="text-3xl mb-1">
                {pointWinner === 'player' ? '🎾' : '😤'}
              </div>
              <div className="text-white font-extrabold text-lg">
                {pointWinner === 'player' ? 'Твоё очко!' : 'Очко бота!'}
              </div>
              {faultReason && (
                <div className="text-white/80 text-xs mt-1 font-medium">
                  {getFaultText(faultReason)}
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
            transition={{ duration: 0.4, delay: 0.6 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.6, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.8 }}
              className={`rounded-3xl px-8 py-6 text-center shadow-2xl border-2 ${
                matchWinner === 'player'
                  ? 'bg-blue-700/95 border-blue-300/50'
                  : 'bg-red-800/95 border-red-400/50'
              }`}
            >
              <div className="text-5xl mb-2">
                {matchWinner === 'player' ? '🏆' : '😔'}
              </div>
              <div className="text-white font-black text-2xl">
                {matchWinner === 'player' ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
              </div>
              <div className="text-white/80 text-sm mt-1.5 mb-4">
                Итоговый счёт: {score.playerSets} : {score.opponentSets} по сетам
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
