'use client'

import { Button } from '@/components/ui/button'

interface DifficultySelectorProps {
  difficulties: string[]
  selected: string
  onChange: (difficulty: string) => void
}

// Русские названия сложностей
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
  expert: 'Эксперт',
  classic: 'Классика',
  daily: 'Ежедневный',
}

export function DifficultySelector({
  difficulties,
  selected,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {difficulties.map((d) => {
        const isSelected = selected === d
        return (
          <Button
            key={d}
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              if (!isSelected) {
                onChange(d)
              }
            }}
          >
            {DIFFICULTY_LABELS[d] || d}
          </Button>
        )
      })}
    </div>
  )
}
