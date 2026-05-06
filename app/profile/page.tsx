'use client'

import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { LogOut, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, isGuest } = useAuthStore()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Account Linking: гость может привязать Google-аккаунт
  async function handleLinkGoogle() {
    const { error } = await supabase.auth.linkIdentity({ provider: 'google' })
    if (error) {
      // Фоллбэк: если linkIdentity не поддерживается или вернул ошибку
      const guestId = user?.id
      if (guestId) {
        localStorage.setItem('minigame_guest_id', guestId)
      }
      await supabase.auth.signOut()
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/callback` },
      })
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4">
        <p className="text-muted-foreground">Вы не авторизованы</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold">Профиль</h1>

      <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
        <div>
          <span className="text-sm text-muted-foreground">ID</span>
          <p className="font-mono text-xs">{user.id}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p>{user.email || 'Не указан'}</p>
        </div>
        {isGuest && (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Вы вошли как гость. Привяжите аккаунт, чтобы сохранить прогресс.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={handleLinkGoogle}
            >
              <LinkIcon className="h-4 w-4" />
              Привязать Google
            </Button>
          </div>
        )}
      </div>

      <Button
        variant="destructive"
        className="mt-6 gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </Button>
    </div>
  )
}
