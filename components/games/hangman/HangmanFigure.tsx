'use client'

// SVG виселица с поэтапным появлением частей тела
// Части: подставка(0), столб(1), перекладина(2), верёвка(3), голова(4), тело(5), лев.рука(6), прав.рука(7), лев.нога(8), прав.нога(9)

import { motion, AnimatePresence } from 'framer-motion'

interface HangmanFigureProps {
  wrongCount: number
  maxWrong: number
  isWon: boolean
}

const PART_DRAW = {
  delay: { duration: 0.25, ease: 'easeOut' as const },
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
}

export function HangmanFigure({ wrongCount, maxWrong, isWon }: HangmanFigureProps) {
  const show = (n: number) => wrongCount >= n

  // Адаптивное масштабирование: на лёгком (8 ошибок) показываем 9 частей
  // На среднем (6) и сложном (5) — меньше частей
  // Для красоты всегда рисуем все 10 частей в разном порядке
  const parts = 10
  const step = maxWrong / parts

  function shouldShow(partIndex: number): boolean {
    return wrongCount >= Math.round((partIndex + 1) * step)
  }

  const _show = maxWrong === 10
    ? (n: number) => show(n)
    : (n: number) => shouldShow(n - 1)

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox="0 0 200 260"
        className="w-full max-w-[200px] h-auto"
        aria-label={`Виселица: ${wrongCount} ошибок из ${maxWrong}`}
      >
        {/* ── Постоянные элементы: основание виселицы ─── */}
        <line x1="20" y1="250" x2="180" y2="250" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-foreground/70" />
        <line x1="60" y1="250" x2="60" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-foreground/70" />
        <line x1="60" y1="20" x2="130" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-foreground/70" />
        <line x1="130" y1="20" x2="130" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground/50" />

        {/* ── Голова ─── */}
        <AnimatePresence>
          {_show(1) && (
            <motion.circle
              key="head"
              cx="130"
              cy="70"
              r="20"
              fill="none"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              className={isWon ? '' : 'text-foreground'}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
            />
          )}
        </AnimatePresence>

        {/* Лицо — появляется если проиграл */}
        <AnimatePresence>
          {!isWon && wrongCount >= maxWrong && (
            <motion.g key="face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              {/* глаза X */}
              <line x1="123" y1="64" x2="127" y2="68" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <line x1="127" y1="64" x2="123" y2="68" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <line x1="133" y1="64" x2="137" y2="68" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <line x1="137" y1="64" x2="133" y2="68" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              {/* рот */}
              <path d="M 122 76 Q 130 71 138 76" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
          )}
          {isWon && _show(1) && (
            <motion.g key="happy-face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <circle cx="125" cy="66" r="2" fill="#22c55e" />
              <circle cx="135" cy="66" r="2" fill="#22c55e" />
              <path d="M 122 73 Q 130 80 138 73" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Тело ─── */}
        <AnimatePresence>
          {_show(2) && (
            <motion.line
              key="body"
              x1="130" y1="90" x2="130" y2="160"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              strokeLinecap="round"
              className={isWon ? '' : 'text-foreground'}
              {...PART_DRAW}
              transition={PART_DRAW.delay}
            />
          )}
        </AnimatePresence>

        {/* ── Левая рука ─── */}
        <AnimatePresence>
          {_show(3) && (
            <motion.line
              key="left-arm"
              x1="130" y1="110" x2="100" y2="140"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              strokeLinecap="round"
              className={isWon ? '' : 'text-foreground'}
              {...PART_DRAW}
              transition={PART_DRAW.delay}
            />
          )}
        </AnimatePresence>

        {/* ── Правая рука ─── */}
        <AnimatePresence>
          {_show(4) && (
            <motion.line
              key="right-arm"
              x1="130" y1="110" x2="160" y2="140"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              strokeLinecap="round"
              className={isWon ? '' : 'text-foreground'}
              {...PART_DRAW}
              transition={PART_DRAW.delay}
            />
          )}
        </AnimatePresence>

        {/* ── Левая нога ─── */}
        <AnimatePresence>
          {_show(5) && (
            <motion.line
              key="left-leg"
              x1="130" y1="160" x2="100" y2="210"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              strokeLinecap="round"
              className={isWon ? '' : 'text-foreground'}
              {...PART_DRAW}
              transition={PART_DRAW.delay}
            />
          )}
        </AnimatePresence>

        {/* ── Правая нога ─── */}
        <AnimatePresence>
          {_show(6) && (
            <motion.line
              key="right-leg"
              x1="130" y1="160" x2="160" y2="210"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              strokeLinecap="round"
              className={isWon ? '' : 'text-foreground'}
              {...PART_DRAW}
              transition={PART_DRAW.delay}
            />
          )}
        </AnimatePresence>

        {/* ── Доп. части для лёгкого (8 попыток): ступни и кисти ─── */}
        <AnimatePresence>
          {_show(7) && (
            <motion.line
              key="left-foot"
              x1="100" y1="210" x2="85" y2="215"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              strokeLinecap="round"
              className={isWon ? '' : 'text-foreground'}
              {...PART_DRAW}
              transition={PART_DRAW.delay}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {_show(8) && (
            <motion.line
              key="right-foot"
              x1="160" y1="210" x2="175" y2="215"
              stroke={isWon ? '#22c55e' : 'currentColor'}
              strokeWidth="3"
              strokeLinecap="round"
              className={isWon ? '' : 'text-foreground'}
              {...PART_DRAW}
              transition={PART_DRAW.delay}
            />
          )}
        </AnimatePresence>
      </svg>
    </div>
  )
}
