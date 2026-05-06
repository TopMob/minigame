'use client'

import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from '@/components/auth/UserMenu'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Gamepad2 className="h-6 w-6 text-primary" />
          <span>МиниИгры</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Главная
          </Link>
          <Link
            href="/leaderboard"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Рейтинг
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
