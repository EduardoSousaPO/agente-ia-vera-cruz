import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';

/** Palavra (minúscula) → estágio. Comandos simplificados WhatsApp. */
const WORD_STAGE: Record<string, string> = {
  ok: 'in_contact',
  aceitar: 'in_contact',
  visita: 'visit_scheduled',
  proposta: 'proposal_sent',
  negociacao: 'follow_up',
  ganho: 'won',
  venda: 'won',
  perdido: 'lost',
};

/** Fallback: número 1–4 (compatibilidade com comandos antigos). */
const NUM_STAGE: Record<string, string> = {
  '1': 'in_contact',
  '2': 'follow_up',
  '3': 'lost',
  '4': 'won',
};

function parseCommand(text: string): { stage: string; idShort: string } | null {
  const parts = text.trim().split(/\s+/);
  const first = parts[0]?.toLowerCase?.();
  const idShort = parts[1]?.toUpperCase?.();
  if (!idShort) return null;
  const stage = WORD_STAGE[first] ?? NUM_STAGE[parts[0]];
  return stage ? { stage, idShort } : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!requireCrmApiKey(req, res)) return;

    let body: Record<string, unknown> = {};
    if (typeof req.body === 'object' && req.body !== null) {
      body = req.body as Record<string, unknown>;
    } else if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body) as Record<string, unknown>;
      } catch {
        return res.status(400).json({ error: 'Body JSON inválido' });
      }
    }

    const seller_phone = typeof body.seller_phone === 'string' ? body.seller_phone.trim() : '';
    const command_text = typeof body.command_text === 'string' ? body.command_text.trim() : '';
    if (!seller_phone || !command_text) {
      return res.status(400).json({ error: 'seller_phone e command_text são obrigatórios' });
    }

    const parsed = parseCommand(command_text);
    if (!parsed) {
      return res.status(400).json({
        error: 'Comando inválido. Use: <palavra> <ID> (ex.: ok ABC123, visita ABC123, ganho ABC123, perdido ABC123). Palavras: ok, aceitar, visita, proposta, negociacao, ganho, venda, perdido.',
      });
    }

    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id')
      .or(`phone_e164.eq.${seller_phone},phone.eq.${seller_phone}`)
      .eq('is_active', true)
      .maybeSingle();

    if (sellerError) {
      console.error('vendors_command seller query error:', sellerError);
      return res.status(500).json({ error: sellerError.message });
    }

    if (!seller) {
      return res.status(403).json({ error: 'Número não é de vendedor cadastrado' });
    }

    const { stage: new_stage, idShort } = parsed;

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, handoff_short_id, seller_first_action_at')
      .eq('handoff_short_id', idShort)
      .limit(1);

    if (leadsError) {
      console.error('vendors_command leads query error:', leadsError);
      return res.status(500).json({ error: leadsError.message });
    }

    const lead = leads?.[0];
    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado para o ID informado' });
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
      console.error('vendors_command update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    await supabase.from('lead_events').insert({
      lead_id: lead.id,
      event_type: 'vendor_command',
      actor_type: 'seller',
      actor_phone: seller_phone,
      payload: { command_text: command_text.trim(), new_stage },
    });

    return res.status(200).json({ ok: true, new_stage, lead_id: lead.id });
  } catch (err) {
    console.error('vendors_command unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
