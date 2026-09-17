'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

// Провайдер приложения — инициализирует тему оформления
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  // Инициализация темы при монтировании
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return <>{children}</>
}
