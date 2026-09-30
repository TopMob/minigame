// Общий layout для всех игровых страниц
export default function GamesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 w-full max-w-full overflow-x-clip">
      {children}
    </div>
  )
}
