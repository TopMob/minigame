'use client'

import { useEffect, useState } from 'react'
import { formatTimeMMSS } from '@/lib/utils'

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

  return (
    <span className="font-mono text-lg tabular-nums">
      {formatTimeMMSS(seconds)}
    </span>
  )
}
