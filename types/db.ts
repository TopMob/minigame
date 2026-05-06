// Типы базы данных Supabase (автогенерация заменит этот файл позже)

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          is_guest: boolean
          recent_results: unknown[]
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          is_guest?: boolean
          recent_results?: unknown[]
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          is_guest?: boolean
          recent_results?: unknown[]
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          name: string
          category: string | null
          is_multiplayer: boolean
          is_active: boolean
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          category?: string | null
          is_multiplayer?: boolean
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          is_multiplayer?: boolean
          is_active?: boolean
          sort_order?: number
        }
      }
      leaderboard: {
        Row: {
          user_id: string
          game_id: string
          difficulty: string
          best_time_seconds: number | null
          best_score: number | null
          games_played: number
          games_won: number
          updated_at: string
        }
        Insert: {
          user_id: string
          game_id: string
          difficulty: string
          best_time_seconds?: number | null
          best_score?: number | null
          games_played?: number
          games_won?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          game_id?: string
          difficulty?: string
          best_time_seconds?: number | null
          best_score?: number | null
          games_played?: number
          games_won?: number
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          theme: string
          sound_enabled: boolean
          animations_enabled: boolean
          extra: Record<string, unknown>
        }
        Insert: {
          user_id: string
          theme?: string
          sound_enabled?: boolean
          animations_enabled?: boolean
          extra?: Record<string, unknown>
        }
        Update: {
          user_id?: string
          theme?: string
          sound_enabled?: boolean
          animations_enabled?: boolean
          extra?: Record<string, unknown>
        }
      }
    }
    Functions: {
      upsert_leaderboard: {
        Args: {
          p_game_id: string
          p_difficulty: string
          p_time: number
          p_score: number
          p_won: boolean
        }
        Returns: void
      }
    }
    Enums: Record<string, never>
  }
}
