'use client'

// Главный компонент игры Найди пару

import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Volume2, VolumeX, Timer } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useMemory } from '@/games/memory/hooks'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/games/Confetti'
import { soundManager } from '@/lib/audio/sounds'
import { MemoryCardTile } from './MemoryCardTile'
import type { MemoryDifficulty } from '@/games/memory/types'

const DIFFICULTIES: { id: MemoryDifficulty; label: string; emoji: string; desc: string }[] = [
  { id: 'easy',   label: 'Лёгкий',  emoji: '😊', desc: '4×3 • 6 пар'  },
  { id: 'medium', label: 'Средний', emoji: '🤔', desc: '4×4 • 8 пар'  },
  { id: 'hard',   label: 'Сложный', emoji: '🔥', desc: '6×5 • 15 пар' },
]

function useTimer(running: boolean, startTime: number): string {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [running, startTime])

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function MemoryGame() {
  const {
    state,
    gridConfig,
    score,
    handleFlip,
    restart,
    setDifficulty,
  } = useMemory()

  const [muted, setMuted] = useState(soundManager.isMuted)
  const toggleMute = () => setMuted(soundManager.toggleMute())

  const isWon = state.status === 'won'
  const timer = useTimer(state.status === 'in_progress', state.startTime)

  // Размер карточек зависит от сложности
  const cardSize: 'sm' | 'md' | 'lg' =
    state.difficulty === 'hard' ? 'sm' : state.difficulty === 'medium' ? 'md' : 'lg'

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
    gap: state.difficulty === 'hard' ? '6px' : '8px',
  }

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-2xl mx-auto px-4 py-2 select-none">
      {isWon && <Confetti />}

      {/* ── Заголовок ── */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">🃏 Найди пару</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Открывай карточки и находи совпадения
          </p>
        </div>
        <div className="flex gap-1 items-center">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 cursor-pointer">
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => restart()} className="h-8 w-8 cursor-pointer" title="Новая игра">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Выбор сложности ── */}
      <div className="flex gap-2 w-full flex-wrap justify-center">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            onClick={() => setDifficulty(d.id)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              state.difficulty === d.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{d.emoji} {d.label}</span>
            <span className="text-[10px] opacity-60">{d.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Статистика ── */}
      <div className="flex gap-4 sm:gap-6 items-center">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Ходов</div>
          <div className="text-xl font-black">{state.moves}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Пары</div>
          <div className="text-xl font-black">{state.matchedPairs}<span className="text-muted-foreground font-normal text-sm">/{state.totalPairs}</span></div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Timer className="h-3.5 w-3.5" />
          <span className="font-mono font-medium">{isWon ? '✓' : timer}</span>
        </div>
      </div>

      {/* ── Индикатор прогресса ── */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 rounded-full"
          animate={{ width: `${(state.matchedPairs / state.totalPairs) * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* ── Игровое поле ── */}
      <div style={gridStyle} className="w-full">
        {state.cards.map((card) => (
          <motion.div
            key={card.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: card.id * 0.015, duration: 0.25, type: 'spring' }}
          >
            <MemoryCardTile
              card={card}
              onClick={handleFlip}
              disabled={state.isChecking || state.status !== 'in_progress'}
              size={cardSize}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Оверлей победы ── */}
      <AnimatePresence>
        {isWon && (
          <motion.div
            key="win"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="w-full rounded-3xl p-6 text-center bg-emerald-500/10 border-2 border-emerald-500/40"
          >
            <div className="text-5xl mb-2">🎉</div>
            <div className="text-2xl font-black text-emerald-500">Все пары найдены!</div>
            <div className="text-sm text-muted-foreground mt-1.5 space-y-0.5">
              <p>Ходов: <span className="font-bold text-foreground">{state.moves}</span></p>
              <p>Очки: <span className="font-bold text-foreground">{score}</span></p>
            </div>
            <Button onClick={() => restart()} className="mt-4 cursor-pointer">
              <RotateCcw className="h-4 w-4 mr-2" />
              Новая игра
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
