'use client'

// Карточка для игры Найди пару — 3D переворот

import { motion } from 'framer-motion'
import type { MemoryCard } from '@/games/memory/types'

interface MemoryCardProps {
  card: MemoryCard
  onClick: (id: number) => void
  disabled: boolean
  size: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'w-12 h-12 sm:w-14 sm:h-14 text-xl sm:text-2xl',
  md: 'w-14 h-14 sm:w-16 sm:h-16 text-2xl sm:text-3xl',
  lg: 'w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-4xl',
}

export function MemoryCardTile({ card, onClick, disabled, size = 'md' }: MemoryCardProps) {
  const sizeClass = SIZE_CLASSES[size]
  const isInteractive = !card.isFlipped && !card.isMatched && !disabled

  return (
    <motion.div
      className={`${sizeClass} relative cursor-${isInteractive ? 'pointer' : 'default'} select-none`}
      style={{ perspective: '600px' }}
      whileHover={isInteractive ? { scale: 1.07 } : {}}
      whileTap={isInteractive ? { scale: 0.93 } : {}}
      onClick={() => isInteractive && onClick(card.id)}
    >
      {/* Контейнер с 3D переворотом */}
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {/* Рубашка (лицевая сторона до переворота) */}
        <div
          className={`
            absolute inset-0 rounded-2xl border-2 flex items-center justify-center
            bg-gradient-to-br from-primary/20 to-primary/40 border-primary/30
            shadow-sm
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-primary/60 text-lg font-bold select-none">?</span>
        </div>

        {/* Картинка (обратная сторона после переворота) */}
        <div
          className={`
            absolute inset-0 rounded-2xl border-2 flex items-center justify-center
            ${card.isMatched
              ? 'bg-emerald-500/15 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
              : 'bg-card border-border shadow-sm'
            }
          `}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="select-none leading-none">{card.emoji}</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
