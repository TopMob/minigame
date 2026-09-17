'use client'

import { useState, useEffect } from 'react'
import { User, Check, Trophy, Gamepad, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { getPlayerOverallStats, clearAllGameRecords } from '@/lib/storage/records'

export default function ProfilePage() {
  const { profile, setUsername, resetProfile } = useAuthStore()
  const [nicknameInput, setNicknameInput] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [stats, setStats] = useState({ totalGames: 0, gamesWon: 0, winRate: 0, totalScore: 0 })

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (profile?.username) {
        setNicknameInput(profile.username)
      }
      setStats(getPlayerOverallStats())
    })
    return () => cancelAnimationFrame(frame)
  }, [profile?.username])

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nicknameInput.trim()) return
    setUsername(nicknameInput.trim())
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleClearHistory = () => {
    if (window.confirm('Вы уверены, что хотите сбросить всю историю игр и рекорды на этом устройстве?')) {
      clearAllGameRecords()
      setStats({ totalGames: 0, gamesWon: 0, winRate: 0, totalScore: 0 })
    }
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          Профиль игрока
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Управление вашим профилем и статистика на данном устройстве.
        </p>
      </div>

      {/* Настройка имени */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold">Имя игрока</h2>
        <form onSubmit={handleSaveName} className="flex gap-3">
          <input
            type="text"
            value={nicknameInput}
            onChange={(e) => setNicknameInput(e.target.value)}
            maxLength={25}
            placeholder="Введите ваш никнейм"
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          />
          <Button type="submit" className="gap-2 shrink-0">
            {isSaved ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                Сохранено
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Это имя будет отображаться в заголовке и в локальных результатах.
        </p>
      </div>

      {/* Общая статистика */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Общая статистика
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Gamepad className="h-3.5 w-3.5" /> Сыграно партий
            </span>
            <p className="mt-1 text-2xl font-bold font-mono">{stats.totalGames}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> Побед
            </span>
            <p className="mt-1 text-2xl font-bold font-mono text-emerald-500">{stats.gamesWon}</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <span className="text-xs text-muted-foreground">Винрейт</span>
            <p className="mt-1 text-2xl font-bold font-mono">{stats.winRate}%</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <span className="text-xs text-muted-foreground">Набрано очков</span>
            <p className="mt-1 text-2xl font-bold font-mono text-primary">{stats.totalScore}</p>
          </div>
        </div>
      </div>

      {/* Сброс данных */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
        <h2 className="text-sm font-bold text-destructive">Опасная зона</h2>
        <p className="text-xs text-muted-foreground">
          Очистить все локальные рекорды и сбросить профиль к значениям по умолчанию.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={handleClearHistory} className="gap-2 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Сбросить историю игр
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm('Сбросить профиль и создать нового локального игрока?')) {
                resetProfile()
                clearAllGameRecords()
                setStats({ totalGames: 0, gamesWon: 0, winRate: 0, totalScore: 0 })
              }
            }}
            className="text-xs"
          >
            Сбросить профиль полностью
          </Button>
        </div>
      </div>
    </div>
  )
}
