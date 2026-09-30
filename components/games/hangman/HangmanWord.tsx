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
                <AnimatePresence>
                  {isRevealed ? (
                    <motion.span
                      key={`revealed-${pi}-${ci}`}
                      initial={{ opacity: 0, y: -6, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="text-xl sm:text-2xl font-extrabold text-foreground leading-none min-w-[1.2rem] sm:min-w-[1.5rem] text-center"
                    >
                      {displayChar}
                    </motion.span>
                  ) : isWrongReveal ? (
                    <motion.span
                      key={`lost-${pi}-${ci}`}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + ci * 0.03 }}
                      className="text-xl sm:text-2xl font-extrabold text-red-500 leading-none min-w-[1.2rem] sm:min-w-[1.5rem] text-center"
                    >
                      {actualChar}
                    </motion.span>
                  ) : (
                    <span
                      key={`hidden-${pi}-${ci}`}
                      className="text-xl sm:text-2xl font-extrabold text-muted-foreground/30 leading-none min-w-[1.2rem] sm:min-w-[1.5rem] text-center select-none"
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
