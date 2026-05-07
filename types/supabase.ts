export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string | null;
        };
        Update: {
          email?: string;
          created_at?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          color: string | null;
          icon: string | null;
          description: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string | null;
          icon?: string | null;
          description?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string | null;
          icon?: string | null;
          description?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          due_date: string | null;
          start_time: string | null;
          end_time: string | null;
          total_time_minutes: number | null;
          duration_minutes: number | null;
          tags: string[] | null;
          parent_task_id: string | null;
          project_id: string;
          position: number;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          due_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          total_time_minutes?: number | null;
          tags?: string[] | null;
          parent_task_id?: string | null;
          project_id: string;
          position?: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          due_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          total_time_minutes?: number | null;
          tags?: string[] | null;
          parent_task_id?: string | null;
          project_id?: string;
          position?: number;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          timezone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          timezone?: string | null;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          user_id?: string;
          role_id?: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
