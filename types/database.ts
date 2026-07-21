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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_briefings: {
        Row: {
          content: Json
          generated_at: string
          id: string
          project_id: string
        }
        Insert: {
          content: Json
          generated_at?: string
          id?: string
          project_id: string
        }
        Update: {
          content?: Json
          generated_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          cost_cents: number
          created_at: string
          id: string
          input_tokens: number | null
          kind: string
          model: string
          output_tokens: number | null
          user_id: string
        }
        Insert: {
          cost_cents: number
          created_at?: string
          id?: string
          input_tokens?: number | null
          kind: string
          model: string
          output_tokens?: number | null
          user_id: string
        }
        Update: {
          cost_cents?: number
          created_at?: string
          id?: string
          input_tokens?: number | null
          kind?: string
          model?: string
          output_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          audio_storage_path: string | null
          created_at: string
          duration_seconds: number | null
          feedback: Json | null
          follow_up_generated: boolean
          id: string
          is_current: boolean
          question_id: string
          score: number | null
          transcript: string | null
          version: number
        }
        Insert: {
          audio_storage_path?: string | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: Json | null
          follow_up_generated?: boolean
          id?: string
          is_current?: boolean
          question_id: string
          score?: number | null
          transcript?: string | null
          version?: number
        }
        Update: {
          audio_storage_path?: string | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: Json | null
          follow_up_generated?: boolean
          id?: string
          is_current?: boolean
          question_id?: string
          score?: number | null
          transcript?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_plans: {
        Row: {
          generated_at: string
          id: string
          project_id: string
          recommendations: Json
        }
        Insert: {
          generated_at?: string
          id?: string
          project_id: string
          recommendations: Json
        }
        Update: {
          generated_at?: string
          id?: string
          project_id?: string
          recommendations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "coaching_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          conversation_mode: Database["public"]["Enums"]["conversation_mode"]
          created_at: string
          difficulty: Database["public"]["Enums"]["interview_difficulty"]
          duration_seconds: number | null
          id: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_personality: Database["public"]["Enums"]["interviewer_personality"]
          length_minutes: number
          overall_score: number | null
          paused_at: string | null
          paused_seconds: number
          project_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          summary: Json | null
        }
        Insert: {
          completed_at?: string | null
          conversation_mode?: Database["public"]["Enums"]["conversation_mode"]
          created_at?: string
          difficulty: Database["public"]["Enums"]["interview_difficulty"]
          duration_seconds?: number | null
          id?: string
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_personality: Database["public"]["Enums"]["interviewer_personality"]
          length_minutes: number
          overall_score?: number | null
          paused_at?: string | null
          paused_seconds?: number
          project_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          summary?: Json | null
        }
        Update: {
          completed_at?: string | null
          conversation_mode?: Database["public"]["Enums"]["conversation_mode"]
          created_at?: string
          difficulty?: Database["public"]["Enums"]["interview_difficulty"]
          duration_seconds?: number | null
          id?: string
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_personality?: Database["public"]["Enums"]["interviewer_personality"]
          length_minutes?: number
          overall_score?: number | null
          paused_at?: string | null
          paused_seconds?: number
          project_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company: string | null
          created_at: string
          id: string
          role: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          role?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          role?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          asked_at: string | null
          category: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["interview_difficulty"] | null
          id: string
          order_index: number
          question: string
          session_id: string
          tts_audio_path: string | null
        }
        Insert: {
          asked_at?: string | null
          category?: string | null
          created_at?: string
          difficulty?:
            | Database["public"]["Enums"]["interview_difficulty"]
            | null
          id?: string
          order_index: number
          question: string
          session_id: string
          tts_audio_path?: string | null
        }
        Update: {
          asked_at?: string | null
          category?: string | null
          created_at?: string
          difficulty?:
            | Database["public"]["Enums"]["interview_difficulty"]
            | null
          id?: string
          order_index?: number
          question?: string
          session_id?: string
          tts_audio_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          content: string | null
          created_at: string
          id: string
          name: string | null
          project_id: string
          storage_path: string | null
          type: Database["public"]["Enums"]["resource_type"]
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          name?: string | null
          project_id: string
          storage_path?: string | null
          type: Database["public"]["Enums"]["resource_type"]
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          name?: string | null
          project_id?: string
          storage_path?: string | null
          type?: Database["public"]["Enums"]["resource_type"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      conversation_mode: "adaptive" | "fixed"
      interview_difficulty: "easy" | "medium" | "hard"
      interview_type:
        | "behavioral"
        | "technical"
        | "product"
        | "leadership"
        | "panel"
        | "recruiter_screen"
        | "hiring_manager"
        | "executive"
      interviewer_personality:
        | "friendly"
        | "direct"
        | "analytical"
        | "skeptical"
        | "fast_paced"
        | "interrupts_often"
        | "pushes_for_metrics"
        | "challenges_assumptions"
      project_status: "active" | "archived"
      resource_type:
        | "resume"
        | "cover_letter"
        | "portfolio_pdf"
        | "job_description"
        | "linkedin_url"
        | "company_website"
        | "hiring_manager_linkedin"
        | "personal_notes"
        | "other_pdf"
      session_status:
        | "configured"
        | "in_progress"
        | "completed"
        | "abandoned"
        | "paused"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      conversation_mode: ["adaptive", "fixed"],
      interview_difficulty: ["easy", "medium", "hard"],
      interview_type: [
        "behavioral",
        "technical",
        "product",
        "leadership",
        "panel",
        "recruiter_screen",
        "hiring_manager",
        "executive",
      ],
      interviewer_personality: [
        "friendly",
        "direct",
        "analytical",
        "skeptical",
        "fast_paced",
        "interrupts_often",
        "pushes_for_metrics",
        "challenges_assumptions",
      ],
      project_status: ["active", "archived"],
      resource_type: [
        "resume",
        "cover_letter",
        "portfolio_pdf",
        "job_description",
        "linkedin_url",
        "company_website",
        "hiring_manager_linkedin",
        "personal_notes",
        "other_pdf",
      ],
      session_status: [
        "configured",
        "in_progress",
        "completed",
        "abandoned",
        "paused",
      ],
    },
  },
} as const
