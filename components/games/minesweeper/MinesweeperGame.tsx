'use client'

// Главный компонент игры Сапёр:
// - Классический ретро-интерфейс со счетчиками мин и времени
// - Аудиосопровождение всех действий
// - Умная система подсказок (детерминированный расчет ходов)
// - Кастомный размер поля (пользовательские строки, столбцы, мины)
// - Поддержка знаков вопроса (?), масштабирования (зум) и горячих клавиш

import { useState, useEffect, useRef } from 'react'
import { MinesweeperGrid } from './MinesweeperGrid'
import { useMinesweeper } from '@/games/minesweeper/hooks'
import { GameOverlay } from '../GameOverlay'
import { Confetti } from '../Confetti'
import { minesweeperEngine } from '@/games/minesweeper/engine'
import { Button } from '@/components/ui/button'
import {
  RotateCcw,
  Flag,
  Pickaxe,
  Lightbulb,
  HelpCircle,
  Volume2,
  VolumeX,
  Trophy,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Difficulty, CustomBoardConfig } from '@/games/minesweeper/types'

const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'easy', label: 'Лёгкий' },
  { id: 'medium', label: 'Средний' },
  { id: 'hard', label: 'Сложный' },
  { id: 'custom', label: 'Свой' },
]

function padDigits(num: number, digits = 3): string {
  if (num < 0) {
    return '-' + Math.abs(num).toString().padStart(digits - 1, '0')
  }
  return num.toString().padStart(digits, '0')
}

export function MinesweeperGame() {
  const {
    state,
    mode,
    isPressing,
    useQuestionMarks,
    zoom,
    bestTime,
    isMuted,
    toggleMode,
    toggleUseQuestionMarks,
    setZoom,
    toggleMute,
    handleClick,
    toggleFlag,
    restart,
    setDifficulty,
    setCustomConfig,
    requestHint,
    clearHint,
    highlightNeighbors,
    setIsPressing,
  } = useMinesweeper('easy')

  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customRows, setCustomRows] = useState(12)
  const [customCols, setCustomCols] = useState(12)
  const [customMines, setCustomMines] = useState(20)

  const isGameOver = state.status === 'won' || state.status === 'lost'
  const progressPercent = Math.min(
    100,
    Math.round((state.cellsRevealed / Math.max(1, state.totalSafeCells)) * 100)
  )

  // Выбор смайлика
  const getSmiley = () => {
    if (state.status === 'won') return '😎'
    if (state.status === 'lost') return '😵'
    if (isPressing) return '😮'
    return '🙂'
  }

  // Горячие клавиши для десктопа
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.code === 'KeyR') {
        e.preventDefault()
        restart()
      } else if (e.code === 'Space' || e.code === 'KeyF') {
        e.preventDefault()
        toggleMode()
      } else if (e.code === 'KeyH') {
        e.preventDefault()
        requestHint()
      } else if (e.code === 'KeyM') {
        e.preventDefault()
        toggleMute()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [restart, toggleMode, requestHint, toggleMute])

  // Применение кастомной сложности
  const handleApplyCustom = () => {
    const rows = Math.max(8, Math.min(24, Number(customRows) || 12))
    const cols = Math.max(8, Math.min(30, Number(customCols) || 12))
    const maxMines = Math.floor(rows * cols * 0.82)
    const mines = Math.max(1, Math.min(maxMines, Number(customMines) || 15))

    const config: CustomBoardConfig = { rows, cols, mines }
    setCustomConfig(config)
    setIsCustomOpen(false)
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3.5 w-full px-2 transition-all select-none',
        state.difficulty === 'hard' || (state.difficulty === 'custom' && state.cols > 18)
          ? 'max-w-[1100px]'
          : 'max-w-[650px]'
      )}
    >
      {/* Заголовок и карточки рекордов */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center justify-between w-full max-w-[520px]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">💣</span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Сапёр</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Найдите все скрытые мины с помощью логики
            </p>
          </div>

          <div className="flex gap-2">
            {/* Рекорд текущей сложности */}
            <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[70px] border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-0.5">
                <Trophy className="h-2.5 w-2.5 text-amber-500" /> Рекорд
              </span>
              <span className="text-base sm:text-lg font-bold font-mono">
                {bestTime ? `${bestTime}с` : '—'}
              </span>
            </div>

            {/* Прогресс разминирования */}
            <div className="flex flex-col items-center justify-center bg-muted/80 rounded-xl px-3 py-1.5 min-w-[70px] border border-border">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                Очищено
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-500">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Селектор сложности */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {DIFFICULTIES.map((d) => (
            <Button
              key={d.id}
              variant={state.difficulty === d.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (d.id === 'custom') {
                  setIsCustomOpen((prev) => !prev)
                } else {
                  setIsCustomOpen(false)
                  setDifficulty(d.id)
                }
              }}
              className="text-xs font-semibold h-8 px-3"
            >
              {d.label}
              {d.id === 'custom' && <Sliders className="h-3 w-3 ml-1" />}
            </Button>
          ))}
        </div>

        {/* Панель настройки кастомного размера */}
        {isCustomOpen && (
          <div className="flex flex-wrap items-center justify-center gap-3 p-3 bg-card border border-border rounded-xl shadow-md w-full max-w-[460px] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Строк:</span>
              <input
                type="number"
                min={8}
                max={24}
                value={customRows}
                onChange={(e) => setCustomRows(Number(e.target.value))}
                className="w-14 h-8 text-center bg-muted rounded border border-border font-mono font-bold text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Колонок:</span>
              <input
                type="number"
                min={8}
                max={30}
                value={customCols}
                onChange={(e) => setCustomCols(Number(e.target.value))}
                className="w-14 h-8 text-center bg-muted rounded border border-border font-mono font-bold text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Мин:</span>
              <input
                type="number"
                min={1}
                max={Math.floor(customRows * customCols * 0.8)}
                value={customMines}
                onChange={(e) => setCustomMines(Number(e.target.value))}
                className="w-14 h-8 text-center bg-muted rounded border border-border font-mono font-bold text-xs"
              />
            </div>

            <Button size="sm" onClick={handleApplyCustom} className="h-8 gap-1 font-bold text-xs">
              <Check className="h-3.5 w-3.5" /> Создать
            </Button>
          </div>
        )}
      </div>

      {/* Верхняя ретро-панель со счетчиками и смайликом */}
      <div className="flex items-center justify-between w-full max-w-[440px] bg-card/90 border-2 border-border/80 rounded-2xl px-5 py-3 shadow-md">
        {/* Счетчик оставшихся мин */}
        <div className="bg-zinc-950 text-red-500 font-mono font-black text-2xl sm:text-3xl px-3 py-1 rounded-lg border-2 border-zinc-800 tracking-widest select-none shadow-inner">
          {padDigits(state.minesRemaining)}
        </div>

        {/* Смайлик: кнопка перезапуска */}
        <button
          type="button"
          onClick={restart}
          className="text-2xl sm:text-3xl w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-b from-card to-muted border-2 border-border hover:from-muted/60 hover:to-muted active:scale-95 transition-all shadow-sm"
          title="Перезапустить партию (R)"
          aria-label="Перезапустить"
        >
          {getSmiley()}
        </button>

        {/* Счетчик времени */}
        <div className="bg-zinc-950 text-red-500 font-mono font-black text-2xl sm:text-3xl px-3 py-1 rounded-lg border-2 border-zinc-800 tracking-widest select-none shadow-inner">
          {padDigits(state.timeElapsed)}
        </div>
      </div>

      {/* Панель инструментов: подсказка, вопросительные знаки, масштаб, звук */}
      <div className="flex items-center justify-between w-full max-w-[440px] px-1 gap-2">
        <div className="flex items-center gap-1.5">
          {/* Кнопка Подсказки */}
          <Button
            variant="outline"
            size="sm"
            onClick={requestHint}
            disabled={isGameOver}
            className="h-8 px-2.5 gap-1 text-xs font-semibold hover:border-amber-500/50 hover:text-amber-500"
            title="Запросить логическую подсказку (H)"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Подсказка</span>
          </Button>

          {/* Переключатель вопросительных знаков (?) */}
          <Button
            variant={useQuestionMarks ? 'default' : 'outline'}
            size="sm"
            onClick={toggleUseQuestionMarks}
            className="h-8 px-2 text-xs font-semibold gap-1"
            title={useQuestionMarks ? 'Вопросительные знаки включены' : 'Включить знак вопроса (?)'}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="text-[11px]">?</span>
          </Button>

          {/* Переключатель звука */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMute}
            className="h-8 w-8 p-0"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted ? (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-primary" />
            )}
          </Button>
        </div>

        {/* Кнопки зума для больших досок */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setZoom(1)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-bold rounded',
              zoom === 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            title="100% масштаб"
          >
            1x
          </button>
          <button
            type="button"
            onClick={() => setZoom(0.85)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-bold rounded',
              zoom === 0.85 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            title="85% масштаб"
          >
            0.85x
          </button>
          <button
            type="button"
            onClick={() => setZoom(0.7)}
            className={cn(
              'px-2 py-0.5 text-[10px] font-bold rounded',
              zoom === 0.7 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            title="70% масштаб"
          >
            0.7x
          </button>
        </div>
      </div>

      {/* Оповещение с подсказкой */}
      {state.hint && !isGameOver && (
        <div className="w-full max-w-[440px] flex items-center justify-between gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 shrink-0" />
            <span>{state.hint.reason}</span>
          </div>
          <button
            type="button"
            onClick={clearHint}
            className="text-xs text-muted-foreground hover:text-foreground ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Кнопка переключения режима для тач-экранов */}
      <div className="flex sm:hidden w-full max-w-[440px] justify-center">
        <Button
          variant={mode === 'flag' ? 'default' : 'outline'}
          size="sm"
          onClick={toggleMode}
          className="gap-2 w-full h-10 font-bold text-xs rounded-xl shadow-xs"
        >
          {mode === 'flag' ? (
            <>
              <Flag className="h-4 w-4 text-red-500" />
              <span>Режим: Флаг (нажмите для копания)</span>
            </>
          ) : (
            <>
              <Pickaxe className="h-4 w-4 text-amber-500" />
              <span>Режим: Копать (нажмите для флага)</span>
            </>
          )}
        </Button>
      </div>

      {/* Игровое поле с сеткой ячеек */}
      <div className="relative w-full flex justify-center py-1">
        <MinesweeperGrid
          grid={state.grid}
          onCellClick={handleClick}
          onToggleFlag={toggleFlag}
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          onHoverNeighbors={highlightNeighbors}
          isGameOver={isGameOver}
          zoom={zoom}
        />

        {/* Оверлей победы */}
        {state.status === 'won' && (
          <>
            <Confetti />
            <GameOverlay icon="🎉" title="Поздравляем с победой!">
              <div className="text-sm text-muted-foreground space-y-1 mb-2">
                <p>
                  Время разминирования: <strong className="text-foreground">{state.timeElapsed} сек.</strong>
                </p>
                <p>
                  Набрано очков: <strong className="text-primary font-mono">{minesweeperEngine.getScore(state)}</strong>
                </p>
              </div>
              <Button onClick={restart} className="gap-1.5 font-bold">
                <RotateCcw className="h-4 w-4" /> Играть снова
              </Button>
            </GameOverlay>
          </>
        )}

        {/* Оверлей поражения */}
        {state.status === 'lost' && (
          <GameOverlay icon="💥" title="Вы подорвались на мине!">
            <div className="text-sm text-muted-foreground space-y-1 mb-2">
              <p>Не повезло! Попробуйте разминировать снова.</p>
              <p className="text-xs">
                Очищено: <strong className="text-foreground">{progressPercent}%</strong> безопасных клеток
              </p>
            </div>
            <Button onClick={restart} className="gap-1.5 font-bold">
              <RotateCcw className="h-4 w-4" /> Попробовать снова
            </Button>
          </GameOverlay>
        )}
      </div>

      {/* Подсказки управления на клавиатуре */}
      <div className="text-[11px] text-muted-foreground text-center select-none hidden sm:flex flex-col gap-0.5">
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">ЛКМ</kbd>: открыть |{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">ПКМ</kbd>: флаг |{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Клик по цифре / СКМ</kbd>: хординг
        </p>
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Пробел / F</kbd>: сменить режим |{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">H</kbd>: подсказка |{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">R</kbd>: рестарт
        </p>
      </div>
    </div>
  )
}