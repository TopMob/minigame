// Типы для игры Виселица

export type HangmanDifficulty = 'easy' | 'medium' | 'hard'

export type HangmanStatus = 'in_progress' | 'won' | 'lost'

export type LetterStatus = 'unused' | 'correct' | 'wrong'

export interface HangmanState {
  word: string              // загаданное слово (в верхнем регистре)
  hint: string              // подсказка/категория к слову
  guessedLetters: string[]  // угаданные буквы
  wrongLetters: string[]    // неверные буквы
  status: HangmanStatus
  difficulty: HangmanDifficulty
  maxWrong: number          // максимум ошибок (зависит от сложности)
  startTime: number
}
