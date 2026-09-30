'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Shield,
  Crosshair,
  HelpCircle,
  Radio,
  Flame,
  AlertTriangle,
} from 'lucide-react'
import { useBattleship } from '@/games/battleship/hooks'
import { getRemainingShipsToPlace } from '@/games/battleship/engine'
import { soundManager } from '@/lib/audio/sounds'
import { formatTimeMMSS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Confetti } from '@/components/games/Confetti'
import { ShipDock } from './ShipDock'
import { FleetStatus } from './FleetStatus'
import { BattleshipGrid } from './BattleshipGrid'
import type { BattleshipDifficulty } from '@/games/battleship/types'

const DIFFICULTIES: { id: BattleshipDifficulty; label: string; desc: string }[] = [
  { id: 'easy', label: 'Лёгкий', desc: 'Случайная стрельба противника' },
  { id: 'medium', label: 'Средний', desc: 'Шахматный поиск и добивание раненых' },
  { id: 'hard', label: 'Сложный', desc: 'Тепловая карта вероятностей + умный охотник' },
]

export function BattleshipGame() {
  const {
    state,
    placeShipAt,
    removeShip,
    randomizePlayerFleet,
    clearPlayerFleet,
    toggleOrientation,
    setSelectedShipSize,
    startBattle,
    fireAtBot,
    restart,
    setDifficulty,
  } = useBattleship()

  const [muted, setMuted] = useState(soundManager.isMuted)
  const [showRules, setShowRules] = useState(false)
  const [mobileTab, setMobileTab] = useState<'radar' | 'fleet'>('radar')
  const [elapsedSeconds, setElapsedSeconds] = useState(1)

  useEffect(() => {
    if (state.phase !== 'battle') return
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(1, Math.round((Date.now() - state.startTime) / 1000)))
    }, 1000)
    return () => clearInterval(interval)
  }, [state.phase, state.startTime])

  const toggleMute = () => {
    setMuted(soundManager.toggleMute())
  }

  const isPlacement = state.phase === 'placement'
  const isBattle = state.phase === 'battle'
  const isGameOver = state.phase === 'game_over'
  const isPlayerWin = isGameOver && state.winner === 'player'

  const remainingCounts = getRemainingShipsToPlace(state.playerFleet)

  const accuracy =
    state.shotsFired.player > 0
      ? Math.round((state.hitsCount.player / state.shotsFired.player) * 100)
      : 0

  return (
    <div className="relative flex flex-col items-center gap-4 w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 select-none">
      {isPlayerWin && <Confetti />}

      {/* Шапка игры */}
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">🚢 Морской бой</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium">
              10×10
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Классические правила: 10 кораблей, ореол в 1 клетку, повторный выстрел при попадании
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowRules(!showRules)}
            className="h-8 w-8 cursor-pointer"
            title="Правила игры"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8 cursor-pointer"
            title={muted ? 'Включить звук' : 'Выключить звук'}
          >
            {muted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            className="h-8 w-8 cursor-pointer"
            title="Перезапустить"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Панель сложности (в фазе расстановки) */}
      <div className="flex items-center justify-between w-full bg-card/60 p-2 rounded-xl border border-border/60">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Radio className="h-3.5 w-3.5 text-primary" />
          <span>Сложность ИИ:</span>
        </div>

        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              onClick={() => isPlacement && state.difficulty !== d.id && setDifficulty(d.id)}
              disabled={!isPlacement}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                state.difficulty === d.id
                  ? 'border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold shadow-xs'
                  : 'border-border/60 text-muted-foreground hover:text-foreground'
              } ${isPlacement ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
              title={d.desc}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* --- ФАЗА 1: РАССТАНОВКА КОРАБЛЕЙ --- */}
      {isPlacement && (
        <div className="flex flex-col gap-4 w-full">
          <ShipDock
            playerFleet={state.playerFleet}
            selectedSize={state.selectedShipSize}
            orientation={state.placementOrientation}
            remainingCounts={remainingCounts}
            onSelectSize={(size) => setSelectedShipSize(size)}
            onToggleOrientation={toggleOrientation}
            onRandomize={randomizePlayerFleet}
            onClear={clearPlayerFleet}
            onStartBattle={startBattle}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-muted-foreground text-center">
              Кликните по клетке для установки. Кликните по установленному кораблю, чтобы убрать. ПКМ — повернуть.
            </div>

            <BattleshipGrid
              board={state.playerBoard}
              isEnemy={false}
              isPlacementMode={true}
              selectedSize={state.selectedShipSize}
              orientation={state.placementOrientation}
              onCellClick={placeShipAt}
              onRemoveShip={removeShip}
              onToggleOrientation={toggleOrientation}
            />
          </div>
        </div>
      )}

      {/* --- ФАЗА 2: БОЕВЫЕ ДЕЙСТВИЯ --- */}
      {(isBattle || isGameOver) && (
        <div className="flex flex-col gap-4 w-full">
          {/* Индикатор текущего хода */}
          <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
            state.currentTurn === 'player' && !isGameOver
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
              : 'bg-muted/40 border-border text-muted-foreground'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              {isGameOver ? (
                <span>{isPlayerWin ? '🎉 Победа флота!' : '💥 Флот разбит'}</span>
              ) : state.currentTurn === 'player' ? (
                <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <Crosshair className="h-4 w-4 animate-spin" />
                  Ваш залп! Выберите цель на радаре врага.
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-500 animate-pulse">
                  <Flame className="h-4 w-4" />
                  Противник производит залп...
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Точность: <strong className="text-foreground">{accuracy}%</strong>
            </div>
          </div>

          {/* Мобильный переключатель вкладок: Радар / Мой флот */}
          <div className="flex lg:hidden w-full bg-muted/60 p-1 rounded-xl gap-1">
            <button
              onClick={() => setMobileTab('radar')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'radar'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5 text-rose-500" />
              Радар противника (Атака)
            </button>
            <button
              onClick={() => setMobileTab('fleet')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mobileTab === 'fleet'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-cyan-500" />
              Мой флот (Оборона)
            </button>
          </div>

          {/* Сетка полей: Side-by-side на Desktop, Tabbed на Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
            {/* 1. Поле врага (Радар атаки) */}
            <div className={`flex flex-col gap-2 items-center ${
              mobileTab === 'radar' ? 'flex' : 'hidden lg:flex'
            }`}>
              <FleetStatus
                title="Флот противника"
                subtitle="Наносите удары по закрытым секторам"
                fleet={state.botFleet}
                isEnemy={true}
              />
              <BattleshipGrid
                board={state.botBoard}
                isEnemy={true}
                isInteractive={state.currentTurn === 'player' && !state.isBotThinking && !isGameOver}
                onCellClick={fireAtBot}
              />
            </div>

            {/* 2. Своё поле (Оборона) */}
            <div className={`flex flex-col gap-2 items-center ${
              mobileTab === 'fleet' ? 'flex' : 'hidden lg:flex'
            }`}>
              <FleetStatus
                title="Ваш флот"
                subtitle="Контроль повреждений собственных судов"
                fleet={state.playerFleet}
                isEnemy={false}
              />
              <BattleshipGrid
                board={state.playerBoard}
                isEnemy={false}
                isInteractive={false}
              />
            </div>
          </div>

          {/* Журнал боевых событий */}
          <div className="w-full bg-card/60 border border-border/80 rounded-xl p-3 shadow-xs">
            <div className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
              <span>📡</span> Журнал боя:
            </div>
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto text-xs">
              {state.battleLog.slice(0, 4).map((entry, idx) => (
                <div
                  key={idx}
                  className={`py-0.5 px-2 rounded-md ${
                    idx === 0
                      ? 'bg-primary/10 text-foreground font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- ФАЗА 3: МОДАЛЬНОЕ ОКНО ОКОНЧАНИЯ БОЯ --- */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md p-6 rounded-2xl bg-card border-2 border-primary/40 shadow-2xl flex flex-col items-center text-center gap-4"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner ${
              isPlayerWin
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
            }`}>
              {isPlayerWin ? <Trophy className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
            </div>

            <div>
              <h2 className="text-2xl font-black">
                {isPlayerWin ? '🎉 Морская победа!' : 'Морское поражение'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {isPlayerWin
                  ? 'Все вражеские суда потоплены! Превосходство на море установлено.'
                  : 'Ваш флот был разбит. Враг захватил сектор.'}
              </p>
            </div>

            {/* Итоговая статистика */}
            <div className="grid grid-cols-3 gap-2 w-full bg-muted/40 p-3 rounded-xl border border-border/60 text-center">
              <div>
                <div className="text-[10px] text-muted-foreground">Точность</div>
                <div className="text-base font-black text-foreground">{accuracy}%</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Залпов</div>
                <div className="text-base font-black text-foreground">{state.shotsFired.player}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Время</div>
                <div className="text-base font-black text-foreground">{formatTimeMMSS(elapsedSeconds)}</div>
              </div>
            </div>

            <Button onClick={restart} className="w-full gap-2 cursor-pointer font-bold h-10">
              <RotateCcw className="h-4 w-4" />
              Новый бой
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Раскрывающийся блок правил */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-muted/40 border border-border rounded-xl p-4 text-xs text-muted-foreground space-y-2 overflow-hidden"
          >
            <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <span>📖</span> Классические правила Морского боя:
            </div>
            <p>
              1. <strong>Состав флота (10 кораблей):</strong> 1 четырёхпалубный (линкор), 2 трёхпалубных (крейсера), 3 двухпалубных (эсминцы), 4 однопалубных (катера). Всего 20 палуб.
            </p>
            <p>
              2. <strong>Ореол в 1 клетку:</strong> корабли не могут касаться друг друга ни сторонами, ни углами.
            </p>
            <p>
              3. <strong>Повторный выстрел:</strong> если вы попали в корабль противника («Ранен» или «Потоплен»), вы получаете право на ещё один выстрел. Ход переходит только при промахе («Мимо»).
            </p>
            <p>
              4. <strong>Авто-ореол:</strong> когда корабль полностью потоплен, клетки вокруг него автоматически отмечаются точками («Мимо»), чтобы исключить бесполезные выстрелы.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
