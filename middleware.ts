import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware — базовая настройка
// Расширение: проверка авторизации для защищённых маршрутов
export function middleware(_request: NextRequest) {
  // Пока просто пропускаем все запросы
  return NextResponse.next()
}

export const config = {
  // Не применяем middleware к статическим файлам и API
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)',
  ],
}
