import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// OAuth callback — обрабатывает редирект после авторизации через Google / Magic Link
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
