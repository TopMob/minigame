'use client'

// Главный компонент игры Виселица

import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import { useHangman } from '@/games/hangman/hooks'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/games/Confetti'
import { soundManager } from '@/lib/audio/sounds'
import { HangmanFigure } from './HangmanFigure'
import { HangmanKeyboard } from './HangmanKeyboard'
import { HangmanWord } from './HangmanWord'
import type { HangmanDifficulty } from '@/games/hangman/types'

const DIFFICULTIES: { id: HangmanDifficulty; label: string; emoji: string }[] = [
  { id: 'easy', label: 'Лёгкий', emoji: '😊' },
  { id: 'medium', label: 'Средний', emoji: '🤔' },
  { id: 'hard', label: 'Сложный', emoji: '💀' },
]

export function HangmanGame() {
  const { state, maskedWord, remainingAttempts, score, guess, restart, setDifficulty } = useHangman()
  const [muted, setMuted] = useState(soundManager.isMuted)

  const toggleMute = () => {
    setMuted(soundManager.toggleMute())
  }

  const isWon = state.status === 'won'
  const isLost = state.status === 'lost'
  const isOver = isWon || isLost

  // Процент оставшихся попыток для индикатора
  const hpPercent = (remainingAttempts / state.maxWrong) * 100

  return (
    <div className="relative flex flex-col items-center gap-5 w-full max-w-xl mx-auto px-3 sm:px-4 py-2 select-none">
      {isWon && <Confetti />}

      {/* ── Заголовок ── */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            📝 Виселица
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Угадай слово по буквам, пока фигурка не нарисована
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="h-8 w-8 cursor-pointer" title={muted ? 'Включить звук' : 'Выключить звук'}>
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => restart()} className="h-8 w-8 cursor-pointer" title="Новое слово">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Выбор сложности ── */}
      <div className="flex gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              if (state.difficulty !== d.id) {
                setDifficulty(d.id)
              }
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors duration-150 cursor-pointer ${
              state.difficulty === d.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            {d.emoji} {d.label}
          </button>
        ))}
      </div>

      {/* ── Основная игровая область ── */}
      <div className="w-full bg-card/60 border border-border rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start w-full">
          {/* SVG виселица */}
          <div className="w-[150px] sm:w-[170px] shrink-0">
            <HangmanFigure
              wrongCount={state.wrongLetters.length}
              maxWrong={state.maxWrong}
              isWon={isWon}
            />
          </div>

          {/* Правая часть: подсказка, слово, статус */}
          <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start gap-4 w-full">
            {/* Подсказка */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-2xl px-3.5 py-2 text-sm font-medium text-muted-foreground w-full break-words">
              <span className="text-base shrink-0">💡</span>
              <span className="min-w-0 break-words">{state.hint}</span>
            </div>

            {/* Индикатор оставшихся попыток */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Попытки</span>
                <span className={remainingAttempts <= 2 ? 'text-red-500 font-bold' : ''}>{remainingAttempts} / {state.maxWrong}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors ${
                    hpPercent > 60 ? 'bg-emerald-500' : hpPercent > 30 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  animate={{ width: `${hpPercent}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Слово */}
            <div className="w-full flex justify-center sm:justify-start py-2">
              <HangmanWord
                maskedWord={maskedWord}
                isLost={isLost}
                actualWord={state.word}
              />
            </div>

            {/* Неверные буквы */}
            {state.wrongLetters.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Неверные:</span>{' '}
                <span className="text-red-500 font-bold tracking-widest">
                  {state.wrongLetters.join(' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Оверлей результата ── */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className={`w-full rounded-3xl p-5 text-center border-2 ${
              isWon
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="text-4xl mb-2">{isWon ? '🎉' : '💀'}</div>
            <div className={`text-xl font-black ${isWon ? 'text-emerald-500' : 'text-red-500'}`}>
              {isWon ? 'СЛОВО УГАДАНО!' : 'СЛОВО ПРОИГРАНО'}
            </div>
            {isWon && (
              <div className="text-sm text-muted-foreground mt-1">
                Очки: <span className="font-bold text-foreground">{score}</span>
              </div>
            )}
            <Button
              onClick={() => restart()}
              className="mt-4 cursor-pointer"
              variant={isWon ? 'default' : 'outline'}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Следующее слово
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Клавиатура ── */}
      {!isOver && (
        <HangmanKeyboard
          guessedLetters={state.guessedLetters}
          wrongLetters={state.wrongLetters}
          disabled={isOver}
          onGuess={guess}
        />
      )}

      {/* Подсказка по клавиатуре */}
      <p className="text-[11px] text-muted-foreground/60 text-center">
        Нажимай буквы на экране или на физической клавиатуре
      </p>
    </div>
  )
}
