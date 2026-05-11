import React from 'react'

interface GameOverlayProps {
  icon: string
  title: string
  children?: React.ReactNode
}

export function GameOverlay({ icon, title, children }: GameOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-md z-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-4xl">{icon}</span>
        <span className="text-xl font-semibold">{title}</span>
        {children}
      </div>
    </div>
  )
}
