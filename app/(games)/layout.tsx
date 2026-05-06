// Общий layout для всех игровых страниц
export default function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-6">
      {children}
    </div>
  )
}
