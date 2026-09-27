'use client'

// Главный компонент Словоцепи

import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Volume2, VolumeX, Calendar, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { useWordle } from '@/games/wordle/hooks'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/games/Confetti'
import { soundManager } from '@/lib/audio/sounds'
import { WordleGrid } from './WordleGrid'
import { WordleKeyboard } from './WordleKeyboard'

export function WordleGame() {
  const {
    state,
    mode,
    revealingRow,
    handleAdd,
    handleDelete,
    handleSubmit,
    restart,
    setMode,
    keyboardRows,
  } = useWordle('daily')

  const [muted, setMuted] = useState(soundManager.isMuted)
  const toggleMute = () => setMuted(soundManager.toggleMute())

  const isWon = state.status === 'won'
  const isLost = state.status === 'lost'
  const isOver = isWon || isLost

  // Количество попыток для надписи
  const attemptsUsed = state.currentRow

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-4 py-2 select-none">
      {isWon && <Confetti />}

      {/* ── Заголовок ── */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            🔤 Словоцепь
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'daily'
              ? '📅 Ежедневное слово — одно слово на весь день'
              : '🔀 Случайный режим — новое слово каждый раз'}
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

      {/* ── Переключатель режима ── */}
      <div className="flex rounded-2xl border border-border bg-muted/40 p-1 w-full">
        <button
          onClick={() => setMode('daily')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            mode === 'daily'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          Ежедневное
        </button>
        <button
          onClick={() => setMode('random')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            mode === 'random'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shuffle className="h-3.5 w-3.5" />
          Случайное
        </button>
      </div>

      {/* ── Уведомление об ошибке ── */}
      <AnimatePresence>
        {state.errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-foreground text-background text-xs font-bold px-4 py-2 rounded-xl shadow-lg"
          >
            {state.errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Игровая сетка ── */}
      <WordleGrid
        guesses={state.guesses}
        tileStates={state.tileStates}
        currentGuess={state.currentGuess}
        currentRow={state.currentRow}
        revealingRow={revealingRow}
        shake={state.shake}
      />

      {/* ── Результат ── */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 1.2 }}
            className={`w-full rounded-2xl p-4 text-center border ${
              isWon
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="text-3xl mb-1">{isWon ? '🎉' : '😔'}</div>
            <div className={`font-black text-lg ${isWon ? 'text-emerald-500' : 'text-red-500'}`}>
              {isWon
                ? `Слово угадано за ${attemptsUsed} ${attemptsUsed === 1 ? 'попытку' : attemptsUsed < 5 ? 'попытки' : 'попыток'}!`
                : 'Попытки исчерпаны!'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Загаданное слово: <span className="font-bold text-foreground">{state.answer}</span>
            </div>
            {mode === 'random' && (
              <Button onClick={() => restart('random')} className="mt-3 cursor-pointer" size="sm">
                <Shuffle className="h-3.5 w-3.5 mr-1.5" />
                Новое слово
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Клавиатура ── */}
      <WordleKeyboard
        rows={keyboardRows}
        letterMap={state.letterMap}
        disabled={isOver}
        onLetter={handleAdd}
        onDelete={handleDelete}
        onEnter={handleSubmit}
      />

      {/* Подсказка */}
      <p className="text-[11px] text-muted-foreground/60 text-center pb-2">
        🟩 Правильная позиция &nbsp;•&nbsp; 🟨 Есть в слове &nbsp;•&nbsp; ⬜ Нет в слове
      </p>
    </div>
  )
}
