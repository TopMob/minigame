// Движок игры Wordle — чистый TypeScript

import type { TileState, WordleState } from './types'
import { getDailyWord, getRandomWord } from './words'

export const WORD_LENGTH = 5
export const MAX_GUESSES = 6
export const RUSSIAN_KEYBOARD_ROWS = [
  ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
  ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
  ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю'],
]

export function createWordleState(mode: 'daily' | 'random' = 'daily'): WordleState {
  const answer = mode === 'daily' ? getDailyWord() : getRandomWord()

  return {
    answer,
    guesses: [],
    tileStates: [],
    currentGuess: [],
    currentRow: 0,
    status: 'in_progress',
    letterMap: {},
    maxGuesses: MAX_GUESSES,
    errorMessage: null,
    shake: false,
    startTime: Date.now(),
  }
}

/**
 * Оценить попытку — сравнить слово с ответом, вернуть массив TileState
 * Правило: сначала помечаем 'correct' (зелёные), затем 'present' (жёлтые)
 * с учётом оставшихся непомеченных букв ответа
 */
export function evaluateGuess(guess: string[], answer: string): TileState[] {
  const result: TileState[] = new Array(WORD_LENGTH).fill('absent')
  const answerArr = answer.split('')
  const remaining = [...answerArr]

  // Первый проход: correct (зелёные)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answerArr[i]) {
      result[i] = 'correct'
      remaining[i] = '' // помечаем как использованную
    }
  }

  // Второй проход: present (жёлтые)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue
    const idx = remaining.indexOf(guess[i])
    if (idx !== -1) {
      result[i] = 'present'
      remaining[idx] = ''
    }
  }

  return result
}

/** Обновить letterMap на основе оценки попытки */
function updateLetterMap(
  current: Record<string, TileState>,
  guess: string[],
  tileStates: TileState[]
): Record<string, TileState> {
  const next = { ...current }
  const priority: Record<TileState, number> = {
    correct: 3, present: 2, absent: 1, empty: 0, filled: 0,
  }

  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i]
    const state = tileStates[i]
    if (!next[letter] || priority[state] > priority[next[letter]]) {
      next[letter] = state
    }
  }
  return next
}

/** Добавить букву в текущий ввод */
export function addLetter(state: WordleState, letter: string): WordleState {
  if (state.status !== 'in_progress') return state
  if (state.currentGuess.length >= WORD_LENGTH) return state

  return {
    ...state,
    currentGuess: [...state.currentGuess, letter.toUpperCase()],
    errorMessage: null,
    shake: false,
  }
}

/** Удалить последнюю букву */
export function deleteLetter(state: WordleState): WordleState {
  if (state.status !== 'in_progress') return state
  if (state.currentGuess.length === 0) return state

  return {
    ...state,
    currentGuess: state.currentGuess.slice(0, -1),
    errorMessage: null,
    shake: false,
  }
}

/** Подтвердить слово (Enter) */
export function submitGuess(
  state: WordleState,
  validateWord: boolean = true,
  wordValidator: (w: string) => boolean = () => true
): WordleState {
  if (state.status !== 'in_progress') return state

  if (state.currentGuess.length < WORD_LENGTH) {
    return { ...state, errorMessage: 'Слишком мало букв', shake: true }
  }

  const guessWord = state.currentGuess.join('')

  // Проверка: слово должно быть в словаре (опциональная)
  if (validateWord && !wordValidator(guessWord)) {
    return { ...state, errorMessage: 'Слово не найдено в словаре', shake: true }
  }

  const newTileStates = evaluateGuess(state.currentGuess, state.answer)
  const newGuesses = [...state.guesses, [...state.currentGuess]]
  const newAllTileStates = [...state.tileStates, newTileStates]
  const newLetterMap = updateLetterMap(state.letterMap, state.currentGuess, newTileStates)
  const newRow = state.currentRow + 1

  const isWon = newTileStates.every((s) => s === 'correct')
  const isLost = !isWon && newRow >= state.maxGuesses

  return {
    ...state,
    guesses: newGuesses,
    tileStates: newAllTileStates,
    currentGuess: [],
    currentRow: newRow,
    letterMap: newLetterMap,
    status: isWon ? 'won' : isLost ? 'lost' : 'in_progress',
    errorMessage: null,
    shake: false,
  }
}

/** Очки на основе результата */
export function getWordleScore(state: WordleState): number {
  if (state.status !== 'won') return 0
  // Меньше попыток = больше очков
  const attemptsBonus = (MAX_GUESSES - state.currentRow + 1) * 100
  return 100 + attemptsBonus
}
