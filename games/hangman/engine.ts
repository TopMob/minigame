// Движок игры Виселица — чистый TypeScript, без React/DOM

import { getWordsByDifficulty, getMaxWrong } from './words'
import type { HangmanDifficulty, HangmanState } from './types'

// Русский алфавит для клавиатуры
export const RUSSIAN_ALPHABET = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('')

export function createHangmanState(difficulty: HangmanDifficulty, seed?: number): HangmanState {
  const words = getWordsByDifficulty(difficulty)
  const index = seed !== undefined
    ? seed % words.length
    : Math.floor(Math.random() * words.length)
  const entry = words[index]

  return {
    word: entry.word.toUpperCase(),
    hint: entry.hint,
    guessedLetters: [],
    wrongLetters: [],
    status: 'in_progress',
    difficulty,
    maxWrong: getMaxWrong(difficulty),
    startTime: Date.now(),
  }
}

export function guessLetter(state: HangmanState, letter: string): HangmanState {
  const L = letter.toUpperCase()

  // Уже нажатая буква — игнорируем
  if (state.guessedLetters.includes(L) || state.wrongLetters.includes(L)) {
    return state
  }
  if (state.status !== 'in_progress') return state

  const isCorrect = state.word.includes(L)

  const newGuessed = isCorrect ? [...state.guessedLetters, L] : state.guessedLetters
  const newWrong = isCorrect ? state.wrongLetters : [...state.wrongLetters, L]

  // Проверка победы: все буквы слова угаданы
  const allRevealed = state.word.split('').every(
    (ch) => ch === ' ' || newGuessed.includes(ch)
  )

  const newStatus: HangmanState['status'] =
    allRevealed
      ? 'won'
      : newWrong.length >= state.maxWrong
        ? 'lost'
        : 'in_progress'

  return {
    ...state,
    guessedLetters: newGuessed,
    wrongLetters: newWrong,
    status: newStatus,
  }
}

/** Возвращает буквы слова с маскировкой (_) для неугаданных */
export function getMaskedWord(state: HangmanState): string[] {
  return state.word.split('').map((ch) => {
    if (ch === ' ') return ' '
    return state.guessedLetters.includes(ch) ? ch : '_'
  })
}

/** Количество оставшихся попыток */
export function getRemainingAttempts(state: HangmanState): number {
  return state.maxWrong - state.wrongLetters.length
}

/** Очки: зависят от сложности, оставшихся попыток, длины слова */
export function getHangmanScore(state: HangmanState): number {
  if (state.status !== 'won') return 0
  const diffBonus = state.difficulty === 'easy' ? 1 : state.difficulty === 'medium' ? 2 : 3
  const attemptsBonus = getRemainingAttempts(state) * 10
  const lengthBonus = state.word.replace(/\s/g, '').length * 5
  return diffBonus * (100 + attemptsBonus + lengthBonus)
}
