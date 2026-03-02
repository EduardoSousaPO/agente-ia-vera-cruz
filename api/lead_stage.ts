import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './_lib/db.js';

const ALLOWED_STAGES = [
  'in_contact',
  'visit_scheduled',
  'proposal_sent',
  'follow_up',
  'won',
  'lost',
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Token de acesso ausente. Use Authorization: Bearer <token>.' });
    }

    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      console.error('lead_stage: SUPABASE_ANON_KEY (ou VITE_SUPABASE_ANON_KEY) não configurado no servidor.');
      return res.status(500).json({ error: 'Configuração de autenticação ausente.' });
    }

    const authClient = createClient(url, anonKey);
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);
    if (userError || !user?.email) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
    const lead_id = body.lead_id;
    const new_stage = typeof body.new_stage === 'string' ? body.new_stage.trim() : '';
    if (!lead_id || !new_stage) {
      return res.status(400).json({ error: 'lead_id e new_stage são obrigatórios' });
    }
    if (!ALLOWED_STAGES.includes(new_stage as (typeof ALLOWED_STAGES)[number])) {
      return res.status(400).json({
        error: `new_stage inválido. Valores permitidos: ${ALLOWED_STAGES.join(', ')}`,
      });
    }

    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('seller_id, role')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle();

    if (appUserError || !appUser) {
      return res.status(403).json({ error: 'Usuário não autorizado no CRM.' });
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_seller_id, seller_first_action_at')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    const isGestor = appUser.role === 'gestor' || appUser.role === 'admin' || appUser.role === 'manager';
    const isOwner = appUser.seller_id && lead.assigned_seller_id === appUser.seller_id;
    if (!isGestor && !isOwner) {
      return res.status(403).json({ error: 'Lead não atribuído a você.' });
    }

    const now = new Date().toISOString();
    const update: Record<string, unknown> = {
      lead_stage: new_stage,
      updated_at: now,
      last_contact_at: now,
    };
    if (!lead.seller_first_action_at) {
      update.seller_first_action_at = now;
    }

    const { error: updateError } = await supabase.from('leads').update(update).eq('id', lead.id);
    if (updateError) {
      console.error('lead_stage update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    await supabase.from('lead_events').insert({
      lead_id: lead.id,
      event_type: 'stage_change',
      actor_type: appUser.role === 'gestor' || appUser.role === 'admin' || appUser.role === 'manager' ? 'admin' : 'seller',
      actor_phone: null,
      payload: { new_stage, source: 'crm' },
    });

    return res.status(200).json({ ok: true, new_stage });
  } catch (err) {
    console.error('lead_stage unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
