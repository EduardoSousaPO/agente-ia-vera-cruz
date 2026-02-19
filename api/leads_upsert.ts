import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth';
import { supabase } from './_lib/db';

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    conversation_id: body.conversation_id ?? null,
    visitor_id: body.visitor_id ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('leads')
    .select('id, handoff_short_id, lead_stage')
    .eq('lead_phone', lead_phone)
    .maybeSingle();

  let lead_id: string;
  let handoff_short_id: string | null;
  let lead_stage: string;

  if (existing) {
    lead_id = existing.id;
    handoff_short_id = existing.handoff_short_id ?? shortId(existing.id);
    lead_stage = existing.lead_stage ?? 'new';
    await supabase.from('leads').update(payload).eq('id', lead_id);
  } else {
    const { data: inserted, error } = await supabase
      .from('leads')
      .insert({
        ...payload,
        lead_stage: 'new',
      })
      .select('id')
      .single();
    if (error) {
      return res.status(500).json({ error: error.message });
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

  return res.status(200).json({ lead_id, handoff_short_id, lead_stage });
}
