import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';

async function triggerSync(): Promise<void> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://agente-ia-vera-cruz.vercel.app';
  const syncToken = process.env.SYNC_TOKEN || '';
  
  await fetch(`${baseUrl}/api/sync_conversations?token=${syncToken}`, { method: 'GET' });
}

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!requireCrmApiKey(req, res)) return;

    const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
    const lead_phone = body.lead_phone?.trim?.();
    if (!lead_phone) {
      return res.status(400).json({ error: 'lead_phone é obrigatório' });
    }

    const payload: Record<string, unknown> = {
      lead_phone,
      lead_name: body.lead_name ?? null,
      lead_city: body.lead_city ?? null,
      lead_model_interest: body.lead_model_interest ?? null,
      lead_timeframe: body.lead_timeframe ?? null,
      lead_payment_method: body.lead_payment_method ?? null,
      lead_has_cnpj: body.lead_has_cnpj ?? null,
      lead_best_contact_time: body.lead_best_contact_time ?? null,
      lead_notes: body.lead_notes ?? null,
      lead_email: body.lead_email ?? null,
      lead_cpf: body.lead_cpf ?? null,
      lead_birth_date: body.lead_birth_date ?? null,
      lead_down_payment: body.lead_down_payment ?? null,
      conversation_id: body.conversation_id ?? null,
      visitor_id: body.visitor_id ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: selectError } = await supabase
      .from('leads')
      .select('id, handoff_short_id, lead_stage')
      .eq('lead_phone', lead_phone)
      .maybeSingle();

    if (selectError) {
      console.error('leads_upsert select error:', selectError);
      return res.status(500).json({ error: selectError.message });
    }

    let lead_id: string;
    let handoff_short_id: string | null;
    let lead_stage: string;

    if (existing) {
      lead_id = existing.id;
      handoff_short_id = existing.handoff_short_id ?? shortId(existing.id);
      lead_stage = existing.lead_stage ?? 'new';
      const { error: updateError } = await supabase.from('leads').update(payload).eq('id', lead_id);
      if (updateError) {
        console.error('leads_upsert update error:', updateError);
        return res.status(500).json({ error: updateError.message });
      }
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('leads')
        .insert({
          ...payload,
          lead_stage: 'new',
        })
        .select('id')
        .single();
      if (insertError || !inserted) {
        console.error('leads_upsert insert error:', insertError);
        return res.status(500).json({ error: insertError?.message ?? 'Erro ao inserir lead' });
      }
      lead_id = inserted.id;
      handoff_short_id = shortId(lead_id);
      lead_stage = 'new';
      await supabase.from('leads').update({ handoff_short_id }).eq('id', lead_id);
    }

    const event = body.event;
    if (event && typeof event === 'object' && event.type) {
      await supabase.from('lead_events').insert({
        lead_id,
        event_type: event.type,
        actor_type: event.actor_type ?? 'ai',
        actor_phone: event.actor_phone ?? null,
        payload: {
          text: event.text,
          raw: event.raw,
        },
      });
    }

    triggerSync().catch(err => console.error('Sync trigger error:', err));

    return res.status(200).json({ lead_id, handoff_short_id, lead_stage });
  } catch (err) {
    console.error('leads_upsert unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
