interface ScoreBoardProps {
  score: number
  label?: string
}

// Табло очков для игр
export function ScoreBoard({ score, label = 'Очки' }: ScoreBoardProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-card px-4 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-bold tabular-nums">{score}</span>
    </div>
  )
}
