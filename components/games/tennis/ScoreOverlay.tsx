'use client'

// ScoreOverlay — правая боковая панель счёта, подсказок и уведомлений для игры Теннис
// Все подсказки ("НАЖМИ — ПОДАЧА", "АУТ", "ОЧКО БОТУ") вынесены сюда с активного игрового экрана

import { motion, AnimatePresence } from 'framer-motion'
import type { TennisUIState } from '@/games/tennis/hooks'
import { pointsToLabel, SETS_TO_WIN } from '@/games/tennis/types'
import { Button } from '@/components/ui/button'

interface ScoreOverlayProps {
  state: TennisUIState
  onServe: () => void
  onRestart?: () => void
}

export function ScoreOverlay({ state, onServe, onRestart }: ScoreOverlayProps) {
  const { score, phase, pointWinner, faultReason, serveBy, matchWinner, matchOver, rallyCount, isSmash } = state

  const playerPts = pointsToLabel(score.playerPoints, score.opponentPoints)
  const opponentPts = pointsToLabel(score.opponentPoints, score.playerPoints)

  function getFaultText(reason: typeof faultReason): string {
    switch (reason) {
      case 'net':
        return '🕸 Попадание в сетку'
      case 'out':
        return '📍 Аут (за пределы стола)'
      case 'double_bounce':
        return '⚡ Двойной отскок'
      case 'miss':
        return '💨 Промах мимо мяча'
      default:
        return ''
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full select-none">
      {/* ── Карточка табло со счётом ────────────────────────────────────────── */}
      <div className="bg-neutral-900/80 backdrop-blur-md rounded-2xl p-3.5 border border-neutral-800 shadow-xl">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">
          Табло матча
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Соперник (Бот) */}
          <div className="flex flex-col items-center bg-black/40 rounded-xl p-2.5 border border-red-500/20">
            <span className="text-[11px] font-bold text-red-400">🤖 Бот</span>
            <div className="flex gap-1 my-1">
              {Array.from({ length: SETS_TO_WIN }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i < score.opponentSets ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-neutral-700'
                  }`}
                  title={`Сет ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-white">{score.opponentGames}</span>
              <span className="text-xs text-muted-foreground">гейм</span>
            </div>
            <div className="mt-1 text-xs font-bold font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-300">
              {opponentPts} очков
            </div>
          </div>

          {/* Игрок (Ты) */}
          <div className="flex flex-col items-center bg-black/40 rounded-xl p-2.5 border border-blue-500/20">
            <span className="text-[11px] font-bold text-blue-400">👤 Ты</span>
            <div className="flex gap-1 my-1">
              {Array.from({ length: SETS_TO_WIN }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    i < score.playerSets ? 'bg-blue-500 shadow-sm shadow-blue-500/50' : 'bg-neutral-700'
                  }`}
                  title={`Сет ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-white">{score.playerGames}</span>
              <span className="text-xs text-muted-foreground">гейм</span>
            </div>
            <div className="mt-1 text-xs font-bold font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">
              {playerPts} очков
            </div>
          </div>
        </div>
      </div>

      {/* ── Блок подсказки и статуса (Подача / Розыгрыш / Итог очка) ──────────── */}
      <div className="bg-neutral-900/80 backdrop-blur-md rounded-2xl p-3.5 border border-neutral-800 shadow-xl flex flex-col gap-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
          Статус игры
        </div>

        <AnimatePresence mode="wait">
          {/* Фаза подачи */}
          {phase === 'serve' && (
            <motion.div
              key="status-serve"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col items-center gap-2"
            >
              {serveBy === 'player' ? (
                <>
                  <div className="text-center">
                    <span className="text-2xl">🏓</span>
                    <div className="text-sm font-bold text-blue-300 mt-0.5">Твоя подача</div>
                    <p className="text-[11px] text-muted-foreground">Кликни по кнопке или по корту</p>
                  </div>
                  <Button
                    onClick={onServe}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    НАЖМИ — ПОДАЧА!
                  </Button>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-center w-full">
                  <div className="text-2xl mb-1 animate-pulse">🤖</div>
                  <div className="text-xs font-bold text-amber-300">Подача соперника...</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Приготовь ракетку отбить удар</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Фаза розыгрыша */}
          {phase === 'rally' && (
            <motion.div
              key="status-rally"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center w-full"
            >
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Идёт розыгрыш мяча
              </div>
              <div className="text-2xl font-black mt-1 text-white">
                {rallyCount} <span className="text-xs font-normal text-muted-foreground">ударов</span>
              </div>
              {isSmash && (
                <div className="mt-2 text-xs font-black text-amber-400 bg-amber-500/20 py-0.5 px-2 rounded-full inline-block animate-pulse">
                  ⚡ СМЭШ!
                </div>
              )}
            </motion.div>
          )}

          {/* Фаза исхода очка (вынесено с активного экрана!) */}
          {(phase === 'pointEnd' || (matchOver && pointWinner)) && (
            <motion.div
              key={`status-point-${score.playerPoints}-${score.opponentPoints}-${pointWinner}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`p-3.5 rounded-xl border text-center w-full transition-all ${
                pointWinner === 'player'
                  ? 'bg-blue-600/20 border-blue-500/50'
                  : 'bg-red-500/20 border-red-500/50'
              }`}
            >
              <div className="text-2xl mb-0.5">{pointWinner === 'player' ? '🎾' : '😤'}</div>
              <div className="text-sm font-extrabold text-white">
                {pointWinner === 'player' ? 'Твоё очко!' : 'Очко боту!'}
              </div>
              {faultReason && (
                <div className="text-[11px] font-semibold text-neutral-300 mt-1 inline-block bg-black/50 px-2 py-0.5 rounded-md">
                  {getFaultText(faultReason)}
                </div>
              )}
            </motion.div>
          )}

          {/* Завершение матча */}
          {matchOver && matchWinner && (
            <motion.div
              key="status-match-end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3.5 rounded-xl border text-center w-full ${
                matchWinner === 'player'
                  ? 'bg-emerald-600/25 border-emerald-500/60'
                  : 'bg-red-600/25 border-red-500/60'
              }`}
            >
              <div className="text-3xl mb-1">{matchWinner === 'player' ? '🏆' : '😔'}</div>
              <div className="text-base font-black text-white">
                {matchWinner === 'player' ? 'ПОБЕДА В МАТЧЕ!' : 'ПОРАЖЕНИЕ'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Счёт по сетам: {score.playerSets} : {score.opponentSets}
              </div>
              {onRestart && (
                <Button onClick={onRestart} className="mt-2.5 w-full cursor-pointer" variant="outline" size="sm">
                  🔄 Играть снова
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Памятка управления ────────────────────────────────────────────────── */}
      <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800 text-[11px] text-muted-foreground space-y-1">
        <div className="font-semibold text-neutral-300 text-xs mb-1">Подсказка управления:</div>
        <div className="flex items-center gap-1.5">
          <span>🖱️</span> <span><strong>Мышь</strong> = ракетка (1:1 под рукой)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>👆</span> <span><strong>Клик</strong> по полю = подача мяча</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>⚡</span> <span><strong>Взмах вперед</strong> = мощный смэш</span>
        </div>
      </div>
    </div>
  )
}
