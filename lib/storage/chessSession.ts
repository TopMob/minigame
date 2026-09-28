// Хранилище для автосохранения активной сессии Шахмат в localStorage

import type { ChessState } from '@/games/chess/types'

const CHESS_SESSION_KEY = 'minigame:chess_session'

export function saveChessSession(state: ChessState): void {
  if (typeof window === 'undefined') return
  if (state.status !== 'in_progress') {
    clearChessSession()
    return
  }

  try {
    const toSave: Partial<ChessState> = {
      fen: state.fen,
      turn: state.turn,
      status: state.status,
      winner: state.winner,
      isCheck: state.isCheck,
      lastMove: state.lastMove,
      history: state.history,
      captured: state.captured,
      materialAdvantage: state.materialAdvantage,
      difficulty: state.difficulty,
      gameMode: state.gameMode,
      playerColor: state.playerColor,
      startTime: state.startTime,
    }
    localStorage.setItem(CHESS_SESSION_KEY, JSON.stringify(toSave))
  } catch {
    // Игнорируем ошибки доступа к localStorage
  }
}

export function loadChessSession(): ChessState | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(CHESS_SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<ChessState>
    if (!parsed || !parsed.fen || parsed.status !== 'in_progress') {
      clearChessSession()
      return null
    }

    const state: ChessState = {
      fen: parsed.fen,
      turn: parsed.turn || 'w',
      status: 'in_progress',
      winner: null,
      isCheck: Boolean(parsed.isCheck),
      selectedSquare: null,
      validMoves: [],
      lastMove: parsed.lastMove || null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      captured: parsed.captured || { w: [], b: [] },
      materialAdvantage: parsed.materialAdvantage || 0,
      difficulty: parsed.difficulty || 'medium',
      gameMode: parsed.gameMode || 'ai',
      playerColor: parsed.playerColor || 'w',
      isBotThinking: false,
      pendingPromotion: null,
      startTime: parsed.startTime || Date.now(),
    }

    return state
  } catch {
    return null
  }
}

export function clearChessSession(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CHESS_SESSION_KEY)
  } catch {}
}
