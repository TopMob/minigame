'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  rotation: number
  scale: number
  delay: number
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function Confetti() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 440,
      y: (Math.random() - 0.5) * 360 - 40,
      size: Math.random() * 8 + 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.5 + 0.8,
      delay: Math.random() * 0.25,
    }))
  )

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-20">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, p.scale, p.scale * 0.8],
            x: p.x,
            y: p.y,
            rotate: p.rotation,
          }}
          transition={{
            duration: 1.8,
            delay: p.delay,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  )
}
