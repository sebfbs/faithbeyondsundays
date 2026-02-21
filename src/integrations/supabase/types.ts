export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      churches: {
        Row: {
          city: string | null
          code: string
          country: string | null
          created_at: string
          giving_url: string | null
          id: string
          instagram_handle: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          state: string | null
          timezone: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          giving_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          state?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          giving_url?: string | null
          id?: string
          instagram_handle?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          state?: string | null
          timezone?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      community_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          church_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          church_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          church_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_groups_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          church_id: string
          content: string
          created_at: string
          entry_type: string
          id: string
          is_bookmarked: boolean
          sermon_id: string | null
          suggested_scripture_ref: string | null
          suggested_scripture_text: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          church_id: string
          content: string
          created_at?: string
          entry_type?: string
          id?: string
          is_bookmarked?: boolean
          sermon_id?: string | null
          suggested_scripture_ref?: string | null
          suggested_scripture_text?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          church_id?: string
          content?: string
          created_at?: string
          entry_type?: string
          id?: string
          is_bookmarked?: boolean
          sermon_id?: string | null
          suggested_scripture_ref?: string | null
          suggested_scripture_text?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          answered_at: string | null
          church_id: string
          content: string
          created_at: string
          id: string
          is_answered: boolean
          prayer_count: number
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["prayer_visibility"]
        }
        Insert: {
          answered_at?: string | null
          church_id: string
          content: string
          created_at?: string
          id?: string
          is_answered?: boolean
          prayer_count?: number
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["prayer_visibility"]
        }
        Update: {
          answered_at?: string | null
          church_id?: string
          content?: string
          created_at?: string
          id?: string
          is_answered?: boolean
          prayer_count?: number
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["prayer_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          challenges_completed: number
          church_id: string
          created_at: string
          first_name: string | null
          id: string
          instagram_handle: string | null
          last_name: string | null
          onboarding_complete: boolean
          streak_current: number
          streak_longest: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          challenges_completed?: number
          church_id: string
          created_at?: string
          first_name?: string | null
          id?: string
          instagram_handle?: string | null
          last_name?: string | null
          onboarding_complete?: boolean
          streak_current?: number
          streak_longest?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          challenges_completed?: number
          church_id?: string
          created_at?: string
          first_name?: string | null
          id?: string
          instagram_handle?: string | null
          last_name?: string | null
          onboarding_complete?: boolean
          streak_current?: number
          streak_longest?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_content: {
        Row: {
          content: Json
          content_type: Database["public"]["Enums"]["sermon_content_type"]
          created_at: string
          id: string
          sermon_id: string
          version: number
        }
        Insert: {
          content?: Json
          content_type: Database["public"]["Enums"]["sermon_content_type"]
          created_at?: string
          id?: string
          sermon_id: string
          version?: number
        }
        Update: {
          content?: Json
          content_type?: Database["public"]["Enums"]["sermon_content_type"]
          created_at?: string
          id?: string
          sermon_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sermon_content_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_jobs: {
        Row: {
          attempts: number
          church_id: string
          completed_at: string | null
          created_at: string
          error_details: Json | null
          error_message: string | null
          failed_at: string | null
          id: string
          job_type: string
          locked_until: string | null
          max_attempts: number
          priority: number
          sermon_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          attempts?: number
          church_id: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          job_type?: string
          locked_until?: string | null
          max_attempts?: number
          priority?: number
          sermon_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          attempts?: number
          church_id?: string
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          job_type?: string
          locked_until?: string | null
          max_attempts?: number
          priority?: number
          sermon_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sermon_jobs_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_jobs_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_transcripts: {
        Row: {
          created_at: string
          full_text: string
          id: string
          language: string | null
          sermon_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          full_text: string
          id?: string
          language?: string | null
          sermon_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          full_text?: string
          id?: string
          language?: string | null
          sermon_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sermon_transcripts_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: true
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      sermons: {
        Row: {
          audio_url: string | null
          church_id: string
          created_at: string
          duration: string | null
          id: string
          is_current: boolean
          is_published: boolean
          sermon_date: string
          source_type: Database["public"]["Enums"]["sermon_source_type"]
          source_url: string | null
          speaker: string | null
          status: Database["public"]["Enums"]["sermon_status"]
          storage_path: string | null
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          church_id: string
          created_at?: string
          duration?: string | null
          id?: string
          is_current?: boolean
          is_published?: boolean
          sermon_date?: string
          source_type?: Database["public"]["Enums"]["sermon_source_type"]
          source_url?: string | null
          speaker?: string | null
          status?: Database["public"]["Enums"]["sermon_status"]
          storage_path?: string | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          church_id?: string
          created_at?: string
          duration?: string | null
          id?: string
          is_current?: boolean
          is_published?: boolean
          sermon_date?: string
          source_type?: Database["public"]["Enums"]["sermon_source_type"]
          source_url?: string | null
          speaker?: string | null
          status?: Database["public"]["Enums"]["sermon_status"]
          storage_path?: string | null
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sermons_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          church_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_church_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_church: {
        Args: {
          _church_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "pastor" | "leader" | "member"
      job_status: "queued" | "processing" | "completed" | "failed" | "retrying"
      prayer_visibility: "church" | "private"
      sermon_content_type:
        | "spark"
        | "takeaways"
        | "reflection_questions"
        | "scriptures"
        | "chapters"
        | "weekly_challenge"
        | "weekend_reflection"
      sermon_source_type: "upload" | "youtube" | "vimeo"
      sermon_status:
        | "pending"
        | "uploading"
        | "transcribing"
        | "generating"
        | "complete"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "pastor", "leader", "member"],
      job_status: ["queued", "processing", "completed", "failed", "retrying"],
      prayer_visibility: ["church", "private"],
      sermon_content_type: [
        "spark",
        "takeaways",
        "reflection_questions",
        "scriptures",
        "chapters",
        "weekly_challenge",
        "weekend_reflection",
      ],
      sermon_source_type: ["upload", "youtube", "vimeo"],
      sermon_status: [
        "pending",
        "uploading",
        "transcribing",
        "generating",
        "complete",
        "failed",
      ],
    },
  },
} as const
