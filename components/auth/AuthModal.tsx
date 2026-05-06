'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Globe, Mail, UserX } from 'lucide-react'

type AuthTab = 'login' | 'register'

export function AuthModal() {
  const [tab, setTab] = useState<AuthTab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Вход через Google OAuth
  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  // Вход по email + пароль
  async function handleEmailLogin() {
    setLoading(true)
    setError(null)
    if (tab === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Проверьте почту для подтверждения')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  // Magic Link
  async function handleMagicLink() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    })
    if (error) setError(error.message)
    else setMessage('Ссылка для входа отправлена на почту')
    setLoading(false)
  }

  // Гостевой вход
  async function handleGuestLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">
          {tab === 'login' ? 'Вход' : 'Регистрация'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Войдите, чтобы сохранять прогресс и участвовать в рейтинге
        </p>
      </div>

      {/* Google */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        <Globe className="h-4 w-4" />
        Войти через Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или</span>
        </div>
      </div>

      {/* Email + Password */}
      <div className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          className="w-full gap-2"
          onClick={handleEmailLogin}
          disabled={loading || !email}
        >
          <Mail className="h-4 w-4" />
          {tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </Button>
        <Button
          variant="link"
          className="w-full text-xs"
          onClick={handleMagicLink}
          disabled={loading || !email}
        >
          Отправить ссылку для входа на почту
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или</span>
        </div>
      </div>

      {/* Гостевой вход */}
      <Button
        variant="secondary"
        className="w-full gap-2"
        onClick={handleGuestLogin}
        disabled={loading}
      >
        <UserX className="h-4 w-4" />
        Войти как гость
      </Button>

      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}
      {message && (
        <p className="text-center text-sm text-green-600">{message}</p>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {tab === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <button
              onClick={() => setTab('register')}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Зарегистрироваться
            </button>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <button
              onClick={() => setTab('login')}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Войти
            </button>
          </>
        )}
      </p>
    </div>
  )
}
