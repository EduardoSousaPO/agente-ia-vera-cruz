import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './db.js';

export type CrmUser = {
  email: string;
  role: 'gestor' | 'vendedor' | 'admin' | 'manager';
  name: string;
  seller_id: string | null;
  is_active?: boolean;
};

function getSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios para validar o token.');
  }

  return createClient(url, anonKey);
}

export function isGestorRole(role: CrmUser['role'] | undefined): boolean {
  return role === 'gestor' || role === 'admin' || role === 'manager';
}

export async function getCrmUserFromRequest(req: VercelRequest, res: VercelResponse): Promise<CrmUser | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Token de acesso ausente.' });
    return null;
  }

  let authClient;
  try {
    authClient = getSupabaseAuthClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Configuração de autenticação ausente.';
    res.status(500).json({ error: message });
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user?.email) {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('app_users')
    .select('email, role, name, seller_id, is_active')
    .eq('email', user.email)
    .eq('is_active', true)
    .maybeSingle();

  if (profileError || !profile) {
    res.status(403).json({ error: 'Usuário não autorizado no CRM.' });
    return null;
  }

  return profile as CrmUser;
}
