import { createClient } from '@supabase/supabase-js';

const url = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_SUPABASE_URL;
const anonKey = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
}

export default createClient(url, anonKey);
