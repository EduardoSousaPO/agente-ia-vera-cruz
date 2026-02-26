import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';

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

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      lead_name: body.lead_name ?? undefined,
      lead_city: body.lead_city ?? undefined,
      lead_model_interest: body.lead_model_interest ?? undefined,
      lead_timeframe: body.lead_timeframe ?? undefined,
      lead_payment_method: body.lead_payment_method ?? undefined,
      lead_has_cnpj: body.lead_has_cnpj ?? undefined,
      lead_best_contact_time: body.lead_best_contact_time ?? undefined,
      lead_notes: body.lead_notes ?? undefined,
    };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const { data: lead, error } = await supabase
      .from('leads')
      .update(update)
      .eq('lead_phone', lead_phone)
      .select('id, lead_stage, lead_city, lead_model_interest, lead_timeframe, lead_payment_method, qualified_at')
      .single();

    if (error || !lead) {
      console.error('leads_qualify update error:', error);
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const hasRequired =
      lead.lead_city && lead.lead_model_interest && lead.lead_timeframe && lead.lead_payment_method;
    let lead_stage = lead.lead_stage ?? 'new';
    if (hasRequired && !lead.qualified_at) {
      const { error: qualifyError } = await supabase
        .from('leads')
        .update({
          qualified_at: new Date().toISOString(),
          lead_stage: 'qualified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
      if (qualifyError) {
        console.error('leads_qualify stage update error:', qualifyError);
      }
      lead_stage = 'qualified';
      await supabase.from('lead_events').insert({
        lead_id: lead.id,
        event_type: 'qualification_update',
        actor_type: 'system',
        payload: {},
      });
    }

    return res.status(200).json({ lead_id: lead.id, lead_stage });
  } catch (err) {
    console.error('leads_qualify unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
