# MiniGame

Веб-портал классических мини-игр с адаптивным интерфейсом и локальным сохранением прогресса.

**Демо:** [minigame-livid-xi.vercel.app](https://minigame-livid-xi.vercel.app/)

## Игры

В проекте реализованы Sudoku, Minesweeper, 2048, Snake, Pong, Tic-Tac-Toe, Hangman, Wordle, Memory, Connect 4, Checkers, Reversi и Battleship.

Для части игр доступны уровни сложности, локальный PvP, история ходов, подсказки, таймеры и сохранение рекордов. Точный статус отдельных режимов может меняться по мере разработки.

## Особенности

- клиентская работа без собственного бэкенда;
- локальные рекорды и настройки;
- светлая и тёмная темы;
- адаптивное управление для клавиатуры, мыши и touch;
- PWA/offline-возможности.

## Запуск

```bash
git clone https://github.com/TopMob/minigame.git
cd minigame
npm install
npm run dev
```

Проверки:

```bash
npm run lint
npm run build
```

## Архитектура

Игровые движки находятся в `games/` и не зависят от React. UI-компоненты находятся в `components/`, а локальное состояние и сохранение — в `stores/` и `lib/`.

## Стек

Next.js, React, TypeScript, Tailwind CSS, Zustand, Framer Motion и Web Audio API.
