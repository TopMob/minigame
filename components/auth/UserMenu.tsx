'use client'

import { User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export function UserMenu() {
  const profile = useAuthStore((s) => s.profile)

  return (
    <Link href="/profile">
      <Button variant="outline" size="sm" className="gap-2" aria-label="Профиль">
        <User className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline font-medium">{profile?.username || 'Игрок'}</span>
      </Button>
    </Link>
  )
}
