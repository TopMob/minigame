import React from 'react'
import type { PieceType, ChessColor } from '@/games/chess/types'

interface ChessPieceProps {
  type: PieceType
  color: ChessColor
  className?: string
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, className = 'w-full h-full' }) => {
  const isWhite = color === 'w'

  const strokeColor = isWhite ? '#1e293b' : '#f8fafc'
  const fillColor = isWhite ? '#f8fafc' : '#1e293b'
  const accentColor = isWhite ? '#e2e8f0' : '#0f172a'

  switch (type) {
    case 'k': // Король (King)
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Крест */}
          <path d="M22.5 11.5V6M20 8h5" stroke={strokeColor} strokeWidth="1.8" />
          {/* Корона */}
          <path
            d="M22.5 12.5c4 0 7.5 2.5 8 7 0 3-1.5 5.5-3 6.5 3 2 5 5 5 9.5H12.5c0-4.5 2-7.5 5-9.5-1.5-1-3-3.5-3-6.5.5-4.5 4-7 8-7z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          {/* Центральный узор */}
          <path d="M12.5 35.5h20M13.5 38.5h18" stroke={strokeColor} strokeWidth="1.8" />
          <circle cx="22.5" cy="20" r="2.5" fill={accentColor} stroke={strokeColor} strokeWidth="1" />
        </svg>
      )

    case 'q': // Ферзь (Queen)
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="12" r="1.8" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="15" cy="9.5" r="1.8" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="22.5" cy="8.5" r="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="30" cy="9.5" r="1.8" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="37.5" cy="12" r="1.8" fill={fillColor} stroke={strokeColor} strokeWidth="1.2" />
          <path
            d="M9 13.5l3.5 14h20L36 13.5 30 20.5l-7.5-9-7.5 9L9 13.5z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          <path
            d="M12.5 27.5c-1 3 0 7 2 8h16c2-1 3-5 2-8H12.5z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          <path d="M12 38.5h21M13.5 35.5h18" stroke={strokeColor} strokeWidth="1.8" />
        </svg>
      )

    case 'r': // Ладья (Rook)
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M11 38.5h23v-4H11v4zm2.5-4l1.5-16.5h15l1.5 16.5H13.5zm-2-16.5l-.5-6h23l-.5 6H11.5z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          {/* Зубцы */}
          <path d="M16 12v3M22.5 12v3M29 12v3" stroke={strokeColor} strokeWidth="1.8" />
          <path d="M12 35h21" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )

    case 'b': // Слон (Bishop)
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22.5" cy="9" r="2" fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
          <path
            d="M17.5 38.5h10v-3h-10v3zm-2.5-3c0-3 3-5.5 4-8.5 1.5-4 1-8 3.5-15 2.5 7 2 11 3.5 15 1 3 4 5.5 4 8.5H15z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          {/* Прорезь слона */}
          <path d="M21 16l5 5M22.5 14v6" stroke={strokeColor} strokeWidth="1.5" />
          <path d="M14 38.5h17" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )

    case 'n': // Конь (Knight)
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M12 38.5h21c0-4-2-7-3-10-1-3 0-5.5-2-9-2.5-4.5-6-7.5-10.5-8-1 2-2 4-4.5 4.5 0 2 1 3.5 2 4.5-2 1-3 2-4.5 2.5 1 2.5 2 4.5 4 5.5-2 2-2.5 4.5-2.5 7.5 0 1 0 2-.5 3h.5z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          {/* Глаз и грива */}
          <circle cx="18" cy="18" r="1.5" fill={strokeColor} />
          <path d="M24 14c2 1 3 3 3 5" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )

    case 'p': // Пешка (Pawn)
    default:
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22.5" cy="13.5" r="4.5" fill={fillColor} stroke={strokeColor} strokeWidth="1.8" />
          <path
            d="M16 38.5h13v-3.5c0-3-2-5-3.5-7-1-1.5-1.5-3-1.5-5h-3c0 2-.5 3.5-1.5 5-1.5 2-3.5 4-3.5 7v3.5z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.8"
          />
          <path d="M14 38.5h17M17 28h11" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      )
  }
}
