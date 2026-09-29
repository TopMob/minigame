// Типы для игры Wordle

export type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent'

export type WordleStatus = 'in_progress' | 'won' | 'lost'

export interface WordleTile {
  letter: string
  state: TileState
}

export interface WordleState {
  answer: string            // загаданное слово (5 букв, верхний регистр)
  guesses: string[][]       // история попыток (массив строк букв)
  tileStates: TileState[][] // состояние клеток для каждой попытки
  currentGuess: string[]    // текущий ввод
  currentRow: number        // текущая строка (0-5)
  status: WordleStatus
  letterMap: Record<string, TileState> // состояние каждой буквы алфавита
  maxGuesses: number        // 6 по умолчанию
  errorMessage: string | null // для отображения ошибки (слишком короткое и т.д.)
  shake: boolean            // для анимации тряски при неверном вводе
  startTime: number
}
