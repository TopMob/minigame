'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  isRunning: boolean
  onTick?: (seconds: number) => void
}

// Таймер для игр — отображает время в формате мм:сс
export function Timer({ isRunning, onTick }: TimerProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1
        onTick?.(next)
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, onTick])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <span className="font-mono text-lg tabular-nums">
      {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  )
}
