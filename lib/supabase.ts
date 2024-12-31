import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL no está definida');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_ANON_KEY no está definida');
}

interface Database {
  public: {
    Tables: {
      options: {
        Row: {
          id: number;
          server_id: string;
          name: string;
          created_at: string;
          menu_number: number;
        };
        Insert: {
          server_id: string;
          name: string;
          created_at?: string;
          menu_number: number;
        };
      };
      stock: {
        Row: {
          id: number;
          server_id: string;
          option_id: number;
          data: string;
          created_at: string;
          menu_number: number;
        };
        Insert: {
          server_id: string;
          option_id: number;
          data: string;
          created_at?: string;
          menu_number: number;
        };
      };
      bot_config: {
        Row: {
          id: number;
          server_id: string;
          menu1_cooldown: number;
          menu2_cooldown: number;
          menu1_delete_on_use: boolean;
          menu2_delete_on_use: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          server_id: string;
          menu1_cooldown: number;
          menu2_cooldown: number;
          menu1_delete_on_use: boolean;
          menu2_delete_on_use: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      server_names: {
        Row: {
          id: number;
          server_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          server_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey); 