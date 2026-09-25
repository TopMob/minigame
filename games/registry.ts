import type { GameMeta } from '@/types/game'

// Централизованный реестр игр
// Добавление игры = одна запись здесь + папка games/<id>/

export const GAME_REGISTRY: GameMeta[] = [
  {
    id: 'sudoku',
    name: 'Судоку',
    icon: '🔢',
    category: 'logic',
    path: '/sudoku',
    difficulties: ['easy', 'medium', 'hard', 'expert'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: true,
    isActive: true,
  },
  {
    id: 'minesweeper',
    name: 'Сапёр',
    icon: '💣',
    category: 'logic',
    path: '/minesweeper',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: true,
    isActive: true,
  },
  {
    id: '2048',
    name: '2048',
    icon: '🧮',
    category: 'arcade',
    path: '/2048',
    difficulties: ['classic'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: true,
    isActive: true,
  },
  {
    id: 'snake',
    name: 'Змейка',
    icon: '🐍',
    category: 'arcade',
    path: '/snake',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: false,
    isActive: true,
  },
  {
    id: 'hangman',
    name: 'Виселица',
    icon: '📝',
    category: 'word',
    path: '/hangman',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: false,
    isActive: false,
  },
  {
    id: 'wordle',
    name: 'Словоцепь',
    icon: '🔤',
    category: 'word',
    path: '/wordle',
    difficulties: ['daily'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: false,
    isActive: false,
  },
  {
    id: 'memory',
    name: 'Найди пару',
    icon: '🃏',
    category: 'logic',
    path: '/memory',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: false,
    isActive: false,
  },
  {
    id: 'tictactoe',
    name: 'Крестики-нолики',
    icon: '❌',
    category: 'board',
    path: '/tictactoe',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: true,
    pattern: 'C',
    persistsSessions: false,
    isActive: true,
  },
  {
    id: 'connect4',
    name: '4 в ряд',
    icon: '🔴',
    category: 'board',
    path: '/connect4',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: true,
    pattern: 'C',
    persistsSessions: false,
    isActive: false,
  },
  {
    id: 'reversi',
    name: 'Реверси',
    icon: '⚫',
    category: 'board',
    path: '/reversi',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: false,
    isActive: false,
  },
  {
    id: 'checkers',
    name: 'Шашки',
    icon: '🏁',
    category: 'board',
    path: '/checkers',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: false,
    pattern: 'A',
    persistsSessions: false,
    isActive: false,
  },
  {
    id: 'chess',
    name: 'Шахматы',
    icon: '♟️',
    category: 'board',
    path: '/chess',
    difficulties: ['easy', 'medium', 'hard', 'expert'],
    isMultiplayer: false,
    pattern: 'B',
    persistsSessions: true,
    isActive: false,
  },
  {
    id: 'battleship',
    name: 'Морской бой',
    icon: '🚢',
    category: 'board',
    path: '/battleship',
    difficulties: ['classic'],
    isMultiplayer: true,
    pattern: 'C',
    persistsSessions: false,
    isActive: false,
  },
  {
    id: 'pong',
    name: 'Теннис',
    icon: '🎾',
    category: 'arcade',
    path: '/pong',
    difficulties: ['easy', 'medium', 'hard'],
    isMultiplayer: false,
    pattern: 'D',
    persistsSessions: false,
    isActive: true,
  },
]

// Хелперы для работы с реестром
export function getActiveGames(): GameMeta[] {
  return GAME_REGISTRY.filter((g) => g.isActive)
}

export function getAllGames(): GameMeta[] {
  return GAME_REGISTRY
}

export function getGameById(id: string): GameMeta | undefined {
  return GAME_REGISTRY.find((g) => g.id === id)
}

export function getGamesByCategory(category: string): GameMeta[] {
  return GAME_REGISTRY.filter((g) => g.category === category)
}
