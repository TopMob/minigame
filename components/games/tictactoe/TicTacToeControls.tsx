'use client'

import React from 'react'
import { RotateCcw, Bot, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Difficulty, GameMode, Player } from '@/games/tictactoe/types'

interface TicTacToeControlsProps {
  mode: GameMode
  difficulty: Difficulty
  playerSign: Player
  onModeChange: (mode: GameMode) => void
  onDifficultyChange: (diff: Difficulty) => void
  onSignChange: (sign: Player) => void
  onRestart: () => void
}

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Лёгкий' },
  { id: 'medium', label: 'Средний' },
  { id: 'hard', label: 'Сложный' },
]

export function TicTacToeControls({
  mode,
  difficulty,
  playerSign,
  onModeChange,
  onDifficultyChange,
  onSignChange,
  onRestart,
}: TicTacToeControlsProps) {
  return (
    <div className="w-full max-w-[340px] sm:max-w-[380px] space-y-4">
      {/* Кнопка сброса / новой партии */}
      <Button
        variant="outline"
        size="lg"
        onClick={onRestart}
        className="w-full gap-2 rounded-2xl h-11 border-border font-medium hover:bg-accent/60 cursor-pointer"
      >
        <RotateCcw className="h-4 w-4" />
        Начать новую партию
      </Button>

      {/* Переключатель режима игры */}
      <div className="flex rounded-2xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => onModeChange('vs-bot')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            mode === 'vs-bot'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="h-4 w-4" />
          С ботом
        </button>
        <button
          type="button"
          onClick={() => onModeChange('pvp-local')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
            mode === 'pvp-local'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          Вдвоём
        </button>
      </div>

      {/* Настройки бота (если режим с ботом) */}
      {mode === 'vs-bot' && (
        <div className="space-y-3 pt-1">
          {/* Уровень сложности */}
          <div>
            <div className="text-xs text-muted-foreground mb-1.5 font-medium">Сложность бота:</div>
            <div className="grid grid-cols-3 gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onDifficultyChange(d.id)}
                  className={`py-1.5 px-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                    difficulty === d.id
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Выбор своего знака */}
          <div>
            <div className="text-xs text-muted-foreground mb-1.5 font-medium">Ваш знак:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSignChange('X')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  playerSign === 'X'
                    ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>✕</span> Крестики (первый ход)
              </button>
              <button
                type="button"
                onClick={() => onSignChange('O')}
                className={`py-2 px-3 text-xs font-medium rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  playerSign === 'O'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold'
                    : 'border-border bg-card/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>◯</span> Нолики (второй ход)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
