'use client'

import { create } from 'zustand'
import type { Profile } from '@/types/user'

const STORAGE_KEY = 'minigame:profile'

function getInitialProfile(): Profile {
  if (typeof window === 'undefined') {
    return {
      id: 'local-player',
      username: 'Игрок',
      avatarUrl: null,
      isGuest: false,
      recentResults: [],
      createdAt: new Date().toISOString(),
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}

  const defaultProfile: Profile = {
    id: `player_${Math.random().toString(36).slice(2, 9)}`,
    username: 'Игрок',
    avatarUrl: null,
    isGuest: false,
    recentResults: [],
    createdAt: new Date().toISOString(),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile))
  } catch {}

  return defaultProfile
}

interface AuthState {
  profile: Profile
  setUsername: (username: string) => void
  resetProfile: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  profile: getInitialProfile(),
  setUsername: (username: string) => {
    set((state) => {
      const updated = { ...state.profile, username: username.trim() || 'Игрок' }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      return { profile: updated }
    })
  },
  resetProfile: () => {
    const fresh: Profile = {
      id: `player_${Math.random().toString(36).slice(2, 9)}`,
      username: 'Игрок',
      avatarUrl: null,
      isGuest: false,
      recentResults: [],
      createdAt: new Date().toISOString(),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    } catch {}
    set({ profile: fresh })
  },
}))
