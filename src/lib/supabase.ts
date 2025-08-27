import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { SUPABASE_CONFIG } from '../config/supabase-config';

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: 'free' | 'basic' | 'professional' | 'advanced';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'basic' | 'professional' | 'advanced';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          plan?: 'free' | 'basic' | 'professional' | 'advanced';
          created_at?: string;
          updated_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          content: string;
          role: 'user' | 'assistant';
          type: 'text' | 'document' | 'draft';
          document_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          content: string;
          role: 'user' | 'assistant';
          type?: 'text' | 'document' | 'draft';
          document_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          content?: string;
          role?: 'user' | 'assistant';
          type?: 'text' | 'document' | 'draft';
          document_name?: string | null;
          created_at?: string;
        };
      };
    };
  };
}