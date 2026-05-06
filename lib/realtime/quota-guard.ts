// Защита квоты Realtime для пинг-понга (§14)
// Каркас — полная реализация в Фазе 5

export type QuotaStatus = 'ok' | 'warning' | 'blocked'

export interface QuotaInfo {
  status: QuotaStatus
  percentage: number
  message?: string
}

// Проверка текущего уровня использования Realtime квоты
export async function checkRealtimeQuota(): Promise<QuotaInfo> {
  // Заглушка — будет вызывать supabase.rpc('get_realtime_usage_pct')
  return {
    status: 'ok',
    percentage: 0,
  }
}

// Определение статуса по проценту использования
export function getQuotaStatus(percentage: number): QuotaStatus {
  if (percentage >= 0.95) return 'blocked'
  if (percentage >= 0.80) return 'warning'
  return 'ok'
}
