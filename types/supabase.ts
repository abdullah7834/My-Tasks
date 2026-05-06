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
      task_logs: {
        Row: {
          id: string;
          task_id: string;
          event_type: string;
          event_at: string;
          duration_minutes: number | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          event_type: string;
          event_at?: string;
          duration_minutes?: number | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          task_id?: string;
          event_type?: string;
          event_at?: string;
          duration_minutes?: number | null;
          note?: string | null;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          message: string;
          read_at?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          message: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          sender_id?: string;
          recipient_id?: string;
          message?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
      chat_rooms: {
        Row: {
          id: string;
          name: string;
          type: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      chat_room_members: {
        Row: {
          room_id: string;
          user_id: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
        };
        Update: {
          room_id?: string;
          user_id?: string;
        };
      };
      chat_room_messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          message: string;
          read_at?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          message: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          room_id?: string;
          sender_id?: string;
          message?: string;
          read_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
