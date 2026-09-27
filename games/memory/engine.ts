// Движок игры Найди пару — чистый TypeScript

import type { MemoryCard, MemoryDifficulty, MemoryState } from './types'

// Наборы эмодзи для карточек
const EMOJI_SETS = {
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞'],
  food: ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🫒', '🧅', '🥕', '🌽', '🌶️', '🫑', '🥦', '🥬', '🥒', '🍄', '🧄', '🍣', '🍕', '🍔', '🌮', '🍜', '🍰'],
  objects: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🎯', '🎮', '🎸', '🎺', '🎻', '🥁', '🎷', '🎹', '🎲', '🎭', '🎨', '🖼️', '🚀', '🛸', '🎡', '🎢', '🎠', '🎪', '🎟️'],
}

function getGridSize(difficulty: MemoryDifficulty): { cols: number; rows: number; pairs: number } {
  switch (difficulty) {
    case 'easy':   return { cols: 4, rows: 3, pairs: 6 }   // 4×3 = 12 карт, 6 пар
    case 'medium': return { cols: 4, rows: 4, pairs: 8 }   // 4×4 = 16 карт, 8 пар
    case 'hard':   return { cols: 6, rows: 5, pairs: 15 }  // 6×5 = 30 карт, 15 пар
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getGridConfig(difficulty: MemoryDifficulty) {
  return getGridSize(difficulty)
}

export function createMemoryState(difficulty: MemoryDifficulty): MemoryState {
  const { pairs } = getGridSize(difficulty)

  // Объединяем все эмодзи и берём нужное количество
  const allEmojis = shuffle([
    ...EMOJI_SETS.animals,
    ...EMOJI_SETS.food,
    ...EMOJI_SETS.objects,
  ])
  const selectedEmojis = allEmojis.slice(0, pairs)

  // Создаём пары карточек и перемешиваем
  const cardPairs: MemoryCard[] = []
  for (let pairId = 0; pairId < pairs; pairId++) {
    for (let copy = 0; copy < 2; copy++) {
      cardPairs.push({
        id: pairId * 2 + copy,
        pairId,
        emoji: selectedEmojis[pairId],
        isFlipped: false,
        isMatched: false,
      })
    }
  }

  const shuffled = shuffle(cardPairs).map((card, idx) => ({ ...card, id: idx }))

  return {
    cards: shuffled,
    flippedIds: [],
    matchedPairs: 0,
    totalPairs: pairs,
    moves: 0,
    status: 'in_progress',
    difficulty,
    startTime: Date.now(),
    isChecking: false,
    bestMoves: null,
  }
}

/** Перевернуть карточку — возвращает новое состояние */
export function flipCard(state: MemoryState, cardId: number): MemoryState {
  if (state.isChecking) return state
  if (state.status !== 'in_progress') return state

  const card = state.cards[cardId]
  if (!card || card.isFlipped || card.isMatched) return state
  if (state.flippedIds.includes(cardId)) return state
  if (state.flippedIds.length >= 2) return state

  const newFlipped = [...state.flippedIds, cardId]
  const newCards = state.cards.map((c) =>
    c.id === cardId ? { ...c, isFlipped: true } : c
  )

  if (newFlipped.length < 2) {
    return { ...state, cards: newCards, flippedIds: newFlipped }
  }

  // Две карточки открыты — проверяем пару
  const [id1, id2] = newFlipped
  const c1 = newCards[id1]
  const c2 = newCards[id2]
  const isMatch = c1.pairId === c2.pairId

  if (isMatch) {
    const matchedCards = newCards.map((c) =>
      c.id === id1 || c.id === id2 ? { ...c, isMatched: true } : c
    )
    const newMatchedPairs = state.matchedPairs + 1
    const isWon = newMatchedPairs >= state.totalPairs

    return {
      ...state,
      cards: matchedCards,
      flippedIds: [],
      matchedPairs: newMatchedPairs,
      moves: state.moves + 1,
      status: isWon ? 'won' : 'in_progress',
      isChecking: false,
    }
  }

  // Не совпадение — блокируем на время (до hideCards)
  return {
    ...state,
    cards: newCards,
    flippedIds: newFlipped,
    moves: state.moves + 1,
    isChecking: true,
  }
}

/** Скрыть несовпавшие карточки (вызывается с задержкой) */
export function hideUnmatched(state: MemoryState): MemoryState {
  if (state.flippedIds.length !== 2) return state

  const [id1, id2] = state.flippedIds
  const newCards = state.cards.map((c) =>
    c.id === id1 || c.id === id2 ? { ...c, isFlipped: false } : c
  )

  return {
    ...state,
    cards: newCards,
    flippedIds: [],
    isChecking: false,
  }
}

/** Очки: меньше ходов = больше очков */
export function getMemoryScore(state: MemoryState): number {
  if (state.status !== 'won') return 0
  const diffBonus = state.difficulty === 'easy' ? 1 : state.difficulty === 'medium' ? 2 : 3
  const movePenalty = Math.max(0, state.moves - state.totalPairs) * 5
  const baseScore = state.totalPairs * 50
  return Math.max(50, diffBonus * (baseScore - movePenalty))
}
