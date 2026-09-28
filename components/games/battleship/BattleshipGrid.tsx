'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Skull, Target, X } from 'lucide-react'
import { canPlaceShip, getShipCoordinates } from '@/games/battleship/engine'
import {
  COLUMN_LETTERS,
  ROW_NUMBERS,
  type CellData,
  type PlacedShip,
  type ShipOrientation,
  type ShipType,
} from '@/games/battleship/types'

interface BattleshipGridProps {
  board: CellData[][]
  fleet?: PlacedShip[]
  isEnemy?: boolean
  isPlacementMode?: boolean
  selectedSize?: ShipType | null
  orientation?: ShipOrientation
  isInteractive?: boolean
  onCellClick?: (r: number, c: number) => void
  onRemoveShip?: (shipId: string) => void
  onToggleOrientation?: () => void
}

export function BattleshipGrid({
  board,
  fleet = [],
  isEnemy = false,
  isPlacementMode = false,
  selectedSize = null,
  orientation = 'horizontal',
  isInteractive = true,
  onCellClick,
  onRemoveShip,
  onToggleOrientation,
}: BattleshipGridProps) {
  const [hoverCoord, setHoverCoord] = useState<[number, number] | null>(null)

  // Расчёт клеток предварительного просмотра при расстановке
  let ghostCoords: [number, number][] = []
  let isGhostValid = false

  if (isPlacementMode && selectedSize && hoverCoord) {
    const [hr, hc] = hoverCoord
    ghostCoords = getShipCoordinates(hr, hc, selectedSize, orientation)
    isGhostValid = canPlaceShip(board, hr, hc, selectedSize, orientation)
  }

  const isGhostCell = (r: number, c: number) =>
    ghostCoords.some(([gr, gc]) => gr === r && gc === c)

  const handleCellClick = (r: number, c: number) => {
    if (!isInteractive) return

    if (isPlacementMode) {
      const cell = board[r][c]
      // Если кликнули по уже стоящему кораблю — удаляем его обратно в док
      if (cell.shipId && onRemoveShip) {
        onRemoveShip(cell.shipId)
        return
      }
      // Иначе пытаемся поставить выбранный корабль
      if (onCellClick) {
        onCellClick(r, c)
      }
    } else {
      // Режим стрельбы
      if (onCellClick) {
        onCellClick(r, c)
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isPlacementMode && onToggleOrientation) {
      e.preventDefault()
      onToggleOrientation()
    }
  }

  return (
    <div
      onContextMenu={handleContextMenu}
      className={`relative mx-auto w-full max-w-[420px] p-2 sm:p-2.5 rounded-2xl border shadow-xl transition-all ${
        isEnemy
          ? 'bg-slate-950/95 border-rose-900/50 shadow-rose-950/20'
          : 'bg-slate-950/95 border-cyan-900/50 shadow-cyan-950/20'
      }`}
    >
      {/* Верхние буквы (А-К) */}
      <div className="grid grid-cols-10 px-4 pb-1 text-center text-[10px] sm:text-xs font-bold text-cyan-400/80 select-none">
        {COLUMN_LETTERS.map((letter) => (
          <span key={`top-${letter}`}>{letter}</span>
        ))}
      </div>

      <div className="flex items-center">
        {/* Левые цифры (1-10) */}
        <div className="flex flex-col justify-around py-0.5 pr-1.5 h-full text-[10px] sm:text-xs font-bold text-cyan-400/80 select-none">
          {ROW_NUMBERS.map((num) => (
            <span key={`left-${num}`} className="h-full flex items-center">{num}</span>
          ))}
        </div>

        {/* Сетка поля 10x10 */}
        <div
          className="relative flex-1 aspect-square rounded-xl bg-slate-900/90 border border-cyan-900/60 p-0.5 overflow-hidden shadow-inner"
          onMouseLeave={() => setHoverCoord(null)}
        >
          {/* Световые линии радара */}
          <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

          <div className="grid grid-cols-10 grid-rows-10 w-full h-full border border-cyan-900/40 rounded-lg overflow-hidden bg-slate-950/80">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isGhost = isGhostCell(r, c)
                const isShip = cell.state === 'ship'
                const isMiss = cell.state === 'miss'
                const isHit = cell.state === 'hit'
                const isSunk = cell.state === 'sunk'

                // Разрешен ли выстрел в эту клетку
                const canShoot = isEnemy && isInteractive && cell.state === 'empty'

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    onMouseEnter={() => setHoverCoord([r, c])}
                    disabled={!isInteractive || (isEnemy && (isMiss || isHit || isSunk))}
                    aria-label={`Клетка ${COLUMN_LETTERS[c]}${ROW_NUMBERS[r]}`}
                    className={`
                      relative aspect-square w-full flex items-center justify-center
                      border border-cyan-950/60 transition-all select-none group
                      ${
                        canShoot
                          ? 'cursor-crosshair hover:bg-cyan-500/20'
                          : isPlacementMode && cell.shipId
                          ? 'cursor-pointer hover:opacity-75'
                          : isPlacementMode
                          ? 'cursor-pointer'
                          : 'cursor-default'
                      }
                      ${
                        isGhost
                          ? isGhostValid
                            ? 'bg-emerald-500/40 border-emerald-400/80'
                            : 'bg-rose-500/40 border-rose-400/80'
                          : ''
                      }
                      ${
                        !isEnemy && isShip
                          ? 'bg-gradient-to-br from-cyan-800 to-slate-700 border-cyan-600/70'
                          : ''
                      }
                      ${isSunk ? 'bg-rose-950/90 border-rose-700/80' : ''}
                      ${isHit ? 'bg-amber-950/80 border-amber-600/80' : ''}
                      ${isMiss ? 'bg-slate-900/80' : ''}
                    `}
                  >
                    {/* Вид корабля на своем поле в режиме расстановки или защиты */}
                    {!isEnemy && isShip && !isHit && !isSunk && (
                      <div className="w-[78%] h-[78%] rounded-xs bg-cyan-700/90 border border-cyan-400/60 shadow-xs flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-300/60" />
                      </div>
                    )}

                    {/* Попадание (огонь) */}
                    {isHit && (
                      <motion.div
                        initial={{ scale: 0.2 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center text-amber-400 animate-pulse"
                      >
                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 drop-shadow-[0_0_6px_#f59e0b]" />
                      </motion.div>
                    )}

                    {/* Потоплен (череп / крест) */}
                    {isSunk && (
                      <motion.div
                        initial={{ scale: 0.4 }}
                        animate={{ scale: 1 }}
                        className="flex items-center justify-center text-rose-500"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 stroke-[3] drop-shadow-[0_0_8px_#ef4444]" />
                      </motion.div>
                    )}

                    {/* Промах (бело-голубая точка с водным кругом) */}
                    {isMiss && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="relative flex items-center justify-center"
                      >
                        <div className="w-2 h-2 rounded-full bg-cyan-200/90 shadow-[0_0_4px_#38bdf8]" />
                        <div className="absolute w-4 h-4 rounded-full border border-cyan-400/30 animate-ping opacity-60" />
                      </motion.div>
                    )}

                    {/* Прицел при наведении на вражескую клетку */}
                    {canShoot && !isGhost && (
                      <Target className="w-3.5 h-3.5 text-cyan-400/0 group-hover:text-cyan-400/90 transition-all pointer-events-none" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Правые цифры (1-10) */}
        <div className="flex flex-col justify-around py-0.5 pl-1.5 h-full text-[10px] sm:text-xs font-bold text-cyan-400/80 select-none">
          {ROW_NUMBERS.map((num) => (
            <span key={`right-${num}`} className="h-full flex items-center">{num}</span>
          ))}
        </div>
      </div>

      {/* Нижние буквы (А-К) */}
      <div className="grid grid-cols-10 px-4 pt-1 text-center text-[10px] sm:text-xs font-bold text-cyan-400/80 select-none">
        {COLUMN_LETTERS.map((letter) => (
          <span key={`bot-${letter}`}>{letter}</span>
        ))}
      </div>
    </div>
  )
}
