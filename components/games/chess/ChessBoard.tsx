'use client'

import React from 'react'
import { Chess, Square } from 'chess.js'
import { ChessPiece } from './ChessPieces'
import type { ChessColor, PieceType, PendingPromotion } from '@/games/chess/types'

interface ChessBoardProps {
  fen: string
  isFlipped: boolean
  selectedSquare: string | null
  validMoves: string[]
  lastMove: { from: string; to: string } | null
  isCheck: boolean
  turn: ChessColor
  pendingPromotion: PendingPromotion | null
  onSquareClick: (square: string) => void
  onPromotionSelect: (piece: PieceType) => void
  onCancelPromotion: () => void
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  isFlipped,
  selectedSquare,
  validMoves,
  lastMove,
  isCheck,
  turn,
  pendingPromotion,
  onSquareClick,
  onPromotionSelect,
  onCancelPromotion,
}) => {
  const chess = React.useMemo(() => new Chess(fen), [fen])
  const board = chess.board()

  const displayRanks = isFlipped ? [...RANKS].reverse() : RANKS
  const displayFiles = isFlipped ? [...FILES].reverse() : FILES

  // Поиск клетки короля под шахом
  const kingInCheckSquare = React.useMemo(() => {
    if (!isCheck) return null
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (p && p.type === 'k' && p.color === turn) {
          const file = FILES[c]
          const rank = (8 - r).toString()
          return `${file}${rank}`
        }
      }
    }
    return null
  }, [board, isCheck, turn])

  return (
    <div className="relative select-none aspect-square w-full max-w-[540px] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700/60 dark:border-slate-800 bg-slate-900">
      {/* Сетка 8×8 */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}`
            const squareObj = chess.get(square as Square)

            // Шахматный порядок цветов:
            // a8 (fIdx=0, rIdx=0) — светлое поле
            const fileIdxOriginal = FILES.indexOf(file)
            const rankIdxOriginal = parseInt(rank)
            const isLightSquare = (fileIdxOriginal + rankIdxOriginal) % 2 !== 0

            const isSelected = selectedSquare === square
            const isValidMove = validMoves.includes(square)
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square)
            const isKingCheck = kingInCheckSquare === square

            return (
              <button
                key={square}
                type="button"
                onClick={() => onSquareClick(square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 outline-none
                  ${
                    isLightSquare
                      ? 'bg-[#ebecd0] dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                      : 'bg-[#779556] dark:bg-emerald-950/90 text-[#ebecd0] dark:text-emerald-300'
                  }
                  ${isLastMove ? '!bg-amber-400/40 dark:!bg-amber-500/35' : ''}
                  ${isSelected ? '!bg-cyan-500/40 ring-4 ring-cyan-400 ring-inset z-10' : ''}
                  ${isKingCheck ? '!bg-red-600/60 ring-4 ring-red-500 ring-inset animate-pulse z-10' : ''}
                `}
                aria-label={`Клетка ${square}`}
              >
                {/* Метка вертикали внизу (для первой снизу строки) */}
                {rIdx === 7 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold opacity-60 pointer-events-none">
                    {file}
                  </span>
                )}

                {/* Метка горизонтали слева (для первого слева столбца) */}
                {fIdx === 0 && (
                  <span className="absolute top-0.5 left-1 text-[10px] font-bold opacity-60 pointer-events-none">
                    {rank}
                  </span>
                )}

                {/* Фигура */}
                {squareObj && (
                  <div className="w-[82%] h-[82%] relative z-1 pointer-events-none transition-transform duration-100 hover:scale-105 active:scale-95">
                    <ChessPiece type={squareObj.type} color={squareObj.color} />
                  </div>
                )}

                {/* Индикатор допустимого хода */}
                {isValidMove && (
                  <div className="absolute inset-0 flex items-center justify-center z-2 pointer-events-none">
                    {squareObj ? (
                      // Взятие вражеской фигуры: кольцевой прицел
                      <div className="w-[88%] h-[88%] rounded-full border-4 border-rose-500/70 dark:border-rose-400/80 animate-pulse" />
                    ) : (
                      // Обычный ход на свободную клетку: плотный кружок
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/30 dark:bg-white/40 shadow-sm" />
                    )}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Модальное окно выбора фигуры при превращении пешки */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-white mb-1">Превращение пешки</h3>
            <p className="text-xs text-slate-400 mb-5">Выберите фигуру:</p>

            <div className="grid grid-cols-4 gap-3 mb-5">
              {(['q', 'r', 'b', 'n'] as PieceType[]).map((piece) => {
                const names: Record<PieceType, string> = {
                  q: 'Ферзь',
                  r: 'Ладья',
                  b: 'Слон',
                  n: 'Конь',
                  p: 'Пешка',
                  k: 'Король',
                }
                return (
                  <button
                    key={piece}
                    type="button"
                    onClick={() => onPromotionSelect(piece)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-emerald-600/40 border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 mb-1 group-hover:scale-110 transition-transform">
                      <ChessPiece type={piece} color={turn} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-300">{names[piece]}</span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={onCancelPromotion}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Отмена хода
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
