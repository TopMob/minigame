'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

// Google One Tap — показывает всплывающее окно авторизации через Google
// Требует настройки NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function GoogleOneTap() {
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    async function onCredential(response: { credential: string }) {
      await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (typeof window === 'undefined') return
      const google = (window as unknown as { google: { accounts: { id: { initialize: (config: { client_id: string; callback: (response: { credential: string }) => void; auto_select: boolean }) => void; prompt: () => void } } } }).google
      google.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
        auto_select: true,
      })
      google.accounts.id.prompt()
    }

    return () => {
      script.remove()
    }
  }, [])

  return null
}
