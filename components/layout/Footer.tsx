export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} МиниИгры: Портал классических мини-игр</p>
      </div>
    </footer>
  )
}
