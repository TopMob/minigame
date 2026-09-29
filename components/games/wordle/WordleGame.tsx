'use client'

// Главный компонент Wordle

import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Calendar,
  Shuffle,
  Share2,
  HelpCircle,
  Check,
  Sparkles,
} from 'lucide-react'
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
    newRandomWord,
    keyboardRows,
  } = useWordle('daily')

  const [muted, setMuted] = useState(soundManager.isMuted)
  const [copied, setCopied] = useState(false)
  const [showRules, setShowRules] = useState(false)

  const toggleMute = () => setMuted(soundManager.toggleMute())

  const isWon = state.status === 'won'
  const isLost = state.status === 'lost'
  const isOver = isWon || isLost

  const attemptsUsed = state.currentRow

  // Копирование результата в буфер обмена (Wordle emoji grid)
  const handleShare = () => {
    const tileEmojis: Record<string, string> = {
      correct: '🟩',
      present: '🟨',
      absent: '⬛',
    }

    const modeName = mode === 'daily' ? 'День' : 'Случайное'
    const scoreText = isWon ? `${attemptsUsed}/6` : 'X/6'
    let text = `Wordle (${modeName}) ${scoreText}\n\n`

    for (let r = 0; r < attemptsUsed; r++) {
      const rowStates = state.tileStates[r]
      if (rowStates) {
        text += rowStates.map((s) => tileEmojis[s] || '⬛').join('') + '\n'
      }
    }

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-3 w-full max-w-sm sm:max-w-md mx-auto px-2 sm:px-4 py-2 select-none">
      {isWon && <Confetti />}

      {/* ── Заголовок ── */}
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-1.5">
            🔤 Wordle
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'daily'
              ? '📅 Слово дня — одно слово для всех на сегодня'
              : '🔀 Случайный режим — неограниченно новых слов'}
          </p>
        </div>

        <div className="flex gap-1 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowRules((prev) => !prev)}
            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            title="Как играть"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            title={muted ? 'Включить звук' : 'Выключить звук'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => restart()}
            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            title={mode === 'random' ? 'Случайное слово' : 'Перезапустить'}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Правила игры (всплывающая подсказка) ── */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-card border border-border rounded-2xl p-3.5 text-xs text-muted-foreground space-y-2 shadow-md overflow-hidden"
          >
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Правила Wordle</span>
              <button
                onClick={() => setShowRules(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p>Угадайте скрытое слово из 5 букв за 6 попыток. После каждой попытки цвет клеток покажет, насколько вы близки:</p>
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
                  П
                </span>
                <span><b className="text-foreground">Зелёный</b> — буква есть в слове и на своём месте</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-600 text-white font-extrabold flex items-center justify-center text-xs">
                  О
                </span>
                <span><b className="text-foreground">Жёлтый</b> — буква есть в слове, но на другой позиции</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-400 font-extrabold flex items-center justify-center text-xs">
                  Р
                </span>
                <span><b className="text-foreground">Серый</b> — этой буквы нет в загаданном слове</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Переключатель режима ── */}
      <div className="flex rounded-2xl border border-border bg-muted/40 p-1 w-full gap-1">
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
          Случайное слово
        </button>
      </div>

      {/* ── Кнопка «Новое случайное слово» прямо под переключателем (в случайном режиме) ── */}
      {mode === 'random' && (
        <div className="flex w-full justify-between items-center px-1">
          <span className="text-[11px] text-muted-foreground">Бесконечные слова для тренировки</span>
          <Button
            size="sm"
            variant="outline"
            onClick={newRandomWord}
            className="h-7 text-xs px-2.5 gap-1.5 cursor-pointer rounded-lg border-border hover:bg-accent"
          >
            <Shuffle className="h-3 w-3" />
            Случайное слово
          </Button>
        </div>
      )}

      {/* ── Уведомление об ошибке ── */}
      <AnimatePresence>
        {state.errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-foreground text-background text-xs font-bold px-4 py-2 rounded-xl shadow-lg z-10"
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
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.9 }}
            className={`w-full rounded-2xl p-4 text-center border shadow-lg ${
              isWon
                ? 'bg-emerald-500/10 border-emerald-500/40 text-foreground'
                : 'bg-red-500/10 border-red-500/30 text-foreground'
            }`}
          >
            <div className="text-3xl mb-1">{isWon ? '🎉' : '😔'}</div>
            <div className={`font-black text-lg ${isWon ? 'text-emerald-500' : 'text-red-500'}`}>
              {isWon
                ? `Слово угадано за ${attemptsUsed} ${attemptsUsed === 1 ? 'попытку' : attemptsUsed < 5 ? 'попытки' : 'попыток'}!`
                : 'Попытки исчерпаны!'}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Загаданное слово: <span className="font-extrabold text-foreground tracking-wider">{state.answer}</span>
            </div>

            <div className="flex gap-2 justify-center mt-3.5 flex-wrap">
              {mode === 'random' ? (
                <Button onClick={newRandomWord} className="cursor-pointer font-bold" size="sm">
                  <Shuffle className="h-3.5 w-3.5 mr-1.5" />
                  Случайное слово
                </Button>
              ) : (
                <Button onClick={() => setMode('random')} className="cursor-pointer font-bold" size="sm">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Случайный режим
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleShare}
                className="cursor-pointer"
                size="sm"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                    Скопировано!
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 mr-1.5" />
                    Поделиться
                  </>
                )}
              </Button>
            </div>
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

      {/* Подсказка внизу */}
      <p className="text-[11px] text-muted-foreground/60 text-center pb-2">
        🟩 Правильное место &nbsp;•&nbsp; 🟨 Есть в слове &nbsp;•&nbsp; ⬛ Нет в слове
      </p>
    </div>
  )
}
