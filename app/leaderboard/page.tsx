'use client'

// Страница рекордов и статистики для всех активных игр платформы

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Clock, Zap, Play, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getLeaderboardStats,
  getAllGameRecords,
  type DifficultyStats,
  type GameRecord,
} from '@/lib/storage/records'
import { formatTimeMMSS } from '@/lib/utils'

interface GameTab {
  id: string
  name: string
  icon: string
  path: string
}

const GAMES: GameTab[] = [
  { id: 'sudoku', name: 'Судоку', icon: '🔢', path: '/sudoku' },
  { id: '2048', name: '2048', icon: '🧮', path: '/2048' },
  { id: 'snake', name: 'Змейка', icon: '🐍', path: '/snake' },
  { id: 'minesweeper', name: 'Сапёр', icon: '💣', path: '/minesweeper' },
]

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
  expert: 'Эксперт',
  classic: 'Классика',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  hard: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  expert: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  classic: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
}

const GAME_NAMES: Record<string, { name: string; icon: string }> = {
  sudoku: { name: 'Судоку', icon: '🔢' },
  2048: { name: '2048', icon: '🧮' },
  snake: { name: 'Змейка', icon: '🐍' },
  minesweeper: { name: 'Сапёр', icon: '💣' },
}

export default function LeaderboardPage() {
  const [selectedGame, setSelectedGame] = useState<string>('sudoku')
  const [allRecords, setAllRecords] = useState<GameRecord[]>([])
  const [stats, setStats] = useState<DifficultyStats[]>([])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setAllRecords(getAllGameRecords())
      setStats(getLeaderboardStats(selectedGame))
    })
    return () => cancelAnimationFrame(frame)
  }, [selectedGame])

  const currentGame = GAMES.find((g) => g.id === selectedGame) || GAMES[0]

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-10 space-y-8 sm:space-y-10">
      {/* Шапка страницы */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight">Рекорды и статистика</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ваши личные достижения в мини-играх. Данные хранятся автономно в браузере.
          </p>
        </div>

        <Link href={currentGame.path}>
          <Button className="gap-2 shrink-0">
            <Play className="h-4 w-4" />
            Играть в {currentGame.name}
          </Button>
        </Link>
      </div>

      {/* Переключатель игр */}
      <div className="flex flex-wrap gap-2">
        {GAMES.map((game) => (
          <Button
            key={game.id}
            variant={selectedGame === game.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedGame(game.id)}
            className="gap-2 h-9 px-3.5"
          >
            <span>{game.icon}</span>
            <span>{game.name}</span>
          </Button>
        ))}
      </div>

      {/* Сетка рекордов по уровням сложности */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Рекорды: {currentGame.name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const label = DIFFICULTY_LABELS[s.difficulty] || s.difficulty
            const colorClass =
              DIFFICULTY_COLORS[s.difficulty] || 'text-primary bg-primary/10 border-primary/20'

            return (
              <div
                key={s.difficulty}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div>
                  <span
                    className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
                  >
                    {label}
                  </span>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> Лучшее время:
                      </span>
                      <span className="font-mono font-bold">
                        {s.bestTimeSeconds !== null ? formatTimeMMSS(s.bestTimeSeconds) : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Zap className="h-3.5 w-3.5" /> Лучший счёт:
                      </span>
                      <span className="font-mono font-bold">
                        {s.bestScore !== null ? s.bestScore : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground flex justify-between">
                  <span>
                    Побед: <strong className="text-foreground">{s.gamesWon}</strong>
                  </span>
                  <span>
                    Всего игр: <strong className="text-foreground">{s.gamesPlayed}</strong>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Недавние игры */}
      <div>
        <h2 className="text-xl font-bold mb-4">История последних игр</h2>

        {allRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            Пока нет сыгранных партий. Выберите игру и сыграйте свой первый раунд!
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Игра</th>
                  <th className="px-4 py-3">Сложность</th>
                  <th className="px-4 py-3">Результат</th>
                  <th className="px-4 py-3">Время / Ходы</th>
                  <th className="px-4 py-3">Очки</th>
                  <th className="px-4 py-3">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allRecords.slice(0, 15).map((r) => {
                  const meta = GAME_NAMES[r.gameId] || { name: r.gameId, icon: '🎮' }
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{meta.icon}</span>
                          <span>{meta.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold">
                          {DIFFICULTY_LABELS[r.difficulty] || r.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.won ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Победа
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            Завершено
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{formatTimeMMSS(r.timeSeconds)}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{r.score}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(r.playedAt).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}