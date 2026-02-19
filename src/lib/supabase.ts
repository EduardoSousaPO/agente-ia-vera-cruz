import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_SUPABASE_URL;
const anonKey = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY;

const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export default supabase;
export const isSupabaseConfigured = (): boolean => !!supabase;
