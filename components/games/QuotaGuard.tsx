'use client'

// Компонент защиты квоты Realtime (для пинг-понга, Фаза 5)
// Каркас — полная реализация при реализации мультиплеера

interface QuotaGuardProps {
  children: React.ReactNode
}

export function QuotaGuard({ children }: QuotaGuardProps) {
  // Заглушка — будет проверять rpc('get_realtime_usage_pct')
  return <>{children}</>
}
