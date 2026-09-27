'use client'

// Клавиатура для Виселицы: 33 русские буквы, каждая кнопка блокируется после нажатия

import { motion } from 'framer-motion'
import { RUSSIAN_ALPHABET } from '@/games/hangman/engine'

interface HangmanKeyboardProps {
  guessedLetters: string[]
  wrongLetters: string[]
  disabled: boolean
  onGuess: (letter: string) => void
}

export function HangmanKeyboard({
  guessedLetters,
  wrongLetters,
  disabled,
  onGuess,
}: HangmanKeyboardProps) {
  return (
    <div
      className="flex flex-wrap justify-center gap-1.5 max-w-[380px] sm:max-w-[440px]"
      role="group"
      aria-label="Клавиатура для угадывания букв"
    >
      {RUSSIAN_ALPHABET.map((letter, i) => {
        const isCorrect = guessedLetters.includes(letter)
        const isWrong = wrongLetters.includes(letter)
        const isUsed = isCorrect || isWrong

        return (
          <motion.button
            key={letter}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.012, duration: 0.18 }}
            whileTap={{ scale: isUsed || disabled ? 1 : 0.88 }}
            onClick={() => !isUsed && !disabled && onGuess(letter)}
            disabled={isUsed || disabled}
            aria-label={`Буква ${letter}${isCorrect ? ', угадана' : isWrong ? ', неверная' : ''}`}
            className={`
              w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm sm:text-base font-bold
              border transition-all duration-150 select-none
              ${isCorrect
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-500 cursor-default scale-95'
                : isWrong
                  ? 'bg-red-500/15 border-red-500/40 text-red-500/60 cursor-default scale-90 line-through'
                  : disabled
                    ? 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50'
                    : 'bg-card border-border text-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary cursor-pointer active:scale-95'
              }
            `}
          >
            {letter}
          </motion.button>
        )
      })}
    </div>
  )
}
