import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

// Хелпер для создания клиента Supabase в middleware
export function createMiddlewareClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )
}
