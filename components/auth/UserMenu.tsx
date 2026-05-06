'use client'

import { LogIn, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function UserMenu() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
    )
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="gap-2">
          <LogIn className="h-4 w-4" />
          <span className="hidden sm:inline">Войти</span>
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/profile">
      <Button variant="ghost" size="icon" aria-label="Профиль">
        <User className="h-5 w-5" />
      </Button>
    </Link>
  )
}
