// Контракт игрового движка
// Любая игра реализует этот интерфейс в чистом TS, без React/Supabase

export interface GameEngine<State, Action, Options = unknown> {
  createInitialState(opts: Options, seed?: number): State
  applyAction(state: State, action: Action): State
  isValidAction(state: State, action: Action): boolean
  isGameOver(state: State): boolean
  getScore(state: State): number
  /** для мультиплеера: детерминированный хеш состояния — для верификации */
  hashState?(state: State): string
}
