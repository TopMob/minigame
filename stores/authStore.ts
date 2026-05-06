'use client'

import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/user'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isGuest: boolean

  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isGuest: false,

  setUser: (user) =>
    set({
      user,
      isGuest: user?.app_metadata?.provider === 'anonymous' || false,
    }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isGuest: false,
    }),
}))
