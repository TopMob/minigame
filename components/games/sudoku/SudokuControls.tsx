'use client'

// Панель управления Судоку — undo/redo, заметки, подсказка, пауза

import { cn } from '@/lib/utils'

interface SudokuControlsProps {
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onToggleNotes: () => void
  onPause: () => void
  canUndo: boolean
  canRedo: boolean
  isNoteMode: boolean
  hintsUsed: number
  disabled: boolean
}

export function SudokuControls({
  onUndo,
  onRedo,
  onHint,
  onToggleNotes,
  onPause,
  canUndo,
  canRedo,
  isNoteMode,
  hintsUsed,
  disabled,
}: SudokuControlsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center w-full max-w-[450px]">
      <ControlButton
        onClick={onUndo}
        disabled={disabled || !canUndo}
        label="Отменить"
        icon="↩"
      />
      <ControlButton
        onClick={onRedo}
        disabled={disabled || !canRedo}
        label="Повторить"
        icon="↪"
      />
      <ControlButton
        onClick={onToggleNotes}
        disabled={disabled}
        label={isNoteMode ? 'Заметки ✓' : 'Заметки'}
        icon="✏"
        active={isNoteMode}
      />
      <ControlButton
        onClick={onHint}
        disabled={disabled}
        label={`Подсказка (${hintsUsed})`}
        icon="💡"
      />
      <ControlButton
        onClick={onPause}
        disabled={disabled}
        label="Пауза"
        icon="⏸"
      />
    </div>
  )
}

function ControlButton({
  onClick,
  disabled,
  label,
  icon,
  active,
}: {
  onClick: () => void
  disabled: boolean
  label: string
  icon: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border border-border px-3 py-2',
        'text-sm font-medium transition-colors',
        'hover:bg-accent/20 active:bg-accent/30',
        'focus:outline-none focus:ring-2 focus:ring-accent/50',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        active && 'bg-accent/20 border-accent/50',
      )}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
