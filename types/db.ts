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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      game_sessions: {
        Row: {
          id: string
          client_uuid: string | null
          user_id: string | null
          game_id: string
          difficulty: string | null
          status: string
          score: number | null
          duration_seconds: number | null
          moves: number | null
          metadata: Record<string, unknown>
          started_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          client_uuid?: string | null
          user_id?: string | null
          game_id: string
          difficulty?: string | null
          status?: string
          score?: number | null
          duration_seconds?: number | null
          moves?: number | null
          metadata?: Record<string, unknown>
          started_at?: string
          finished_at?: string | null
        }
        Update: {
          id?: string
          client_uuid?: string | null
          user_id?: string | null
          game_id?: string
          difficulty?: string | null
          status?: string
          score?: number | null
          duration_seconds?: number | null
          moves?: number | null
          metadata?: Record<string, unknown>
          started_at?: string
          finished_at?: string | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          game_id: string | null
          name: string
          description: string | null
          icon: string | null
          condition: Record<string, unknown> | null
        }
        Insert: {
          id: string
          game_id?: string | null
          name: string
          description?: string | null
          icon?: string | null
          condition?: Record<string, unknown> | null
        }
        Update: {
          id?: string
          game_id?: string | null
          name?: string
          description?: string | null
          icon?: string | null
          condition?: Record<string, unknown> | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      upsert_leaderboard: {
        Args: {
          p_game_id: string
          p_difficulty: string
          p_time: number
          p_score: number
          p_won: boolean
        }
        Returns: undefined
      }
      merge_guest_into_user: {
        Args: {
          p_guest_id: string
        }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
  }
}
