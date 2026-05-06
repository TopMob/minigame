import { GameGrid } from '@/components/games/GameGrid'
import { GoogleOneTap } from '@/components/auth/GoogleOneTap'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      <GoogleOneTap />

      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          🎮 МиниИгры
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Классические мини-игры прямо в браузере. Играй онлайн и оффлайн.
        </p>
      </section>

      <GameGrid />
    </div>
  )
}
