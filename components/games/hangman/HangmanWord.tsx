'use client'

// Отображение загаданного слова — дефисы для неугаданных, буквы для угаданных

import { motion, AnimatePresence } from 'framer-motion'

interface HangmanWordProps {
  maskedWord: string[]
  isLost: boolean
  actualWord: string
}

export function HangmanWord({ maskedWord, isLost, actualWord }: HangmanWordProps) {
  // Разбиваем на части по пробелам если слово составное
  const wordParts = actualWord.split(' ')
  let charIndex = 0

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {wordParts.map((part, pi) => (
        <div key={pi} className="flex gap-1">
          {part.split('').map((actualChar, ci) => {
            const displayChar = maskedWord[charIndex++]
            const isRevealed = displayChar !== '_'
            const isWrongReveal = isLost && !isRevealed

            return (
              <div key={ci} className="flex flex-col items-center">
                <AnimatePresence mode="wait">
                  {isRevealed ? (
                    <motion.span
                      key={`revealed-${pi}-${ci}`}
                      initial={{ opacity: 0, y: -10, scale: 0.6 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                      className="text-2xl sm:text-3xl font-extrabold text-foreground leading-none min-w-[1.6rem] text-center"
                    >
                      {displayChar}
                    </motion.span>
                  ) : isWrongReveal ? (
                    <motion.span
                      key={`lost-${pi}-${ci}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + ci * 0.05 }}
                      className="text-2xl sm:text-3xl font-extrabold text-red-500 leading-none min-w-[1.6rem] text-center"
                    >
                      {actualChar}
                    </motion.span>
                  ) : (
                    <span
                      key={`hidden-${pi}-${ci}`}
                      className="text-2xl sm:text-3xl font-extrabold text-muted-foreground/30 leading-none min-w-[1.6rem] text-center"
                    >
                      _
                    </span>
                  )}
                </AnimatePresence>
                {/* Черта под буквой */}
                <div
                  className={`h-0.5 w-full mt-1 rounded-full transition-colors ${
                    isRevealed
                      ? 'bg-emerald-500'
                      : isWrongReveal
                        ? 'bg-red-500'
                        : 'bg-border'
                  }`}
                />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
