// Заглушка страницы Судоку — реализация в Фазе 1
export default function SudokuPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="text-6xl">🔢</span>
      <h1 className="mt-4 text-3xl font-bold">Судоку</h1>
      <p className="mt-2 text-muted-foreground">
        Скоро здесь появится полноценная игра в Судоку
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Фаза 1 — в разработке
      </p>
    </div>
  )
}
