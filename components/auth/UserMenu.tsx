'use client'

import { useSyncExternalStore } from 'react'
import { User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

const emptySubscribe = () => () => {}

export function UserMenu() {
  const profile = useAuthStore((s) => s.profile)
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  return (
    <Link href="/profile">
      <Button variant="outline" size="sm" className="gap-2" aria-label="Профиль">
        <User className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline font-medium">
          {isClient ? profile?.username || 'Игрок' : 'Игрок'}
        </span>
      </Button>
    </Link>
  )
}

