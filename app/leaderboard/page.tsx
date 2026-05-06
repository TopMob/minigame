// Заглушка страницы рейтинга — наполнится данными при реализации игр
export default function LeaderboardPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold">Рейтинг</h1>
      <p className="mt-4 text-muted-foreground">
        Таблица лидеров появится после запуска первой игры (Судоку — Фаза 1)
      </p>
    </div>
  )
}
