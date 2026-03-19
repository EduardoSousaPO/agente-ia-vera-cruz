import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/db.js';
import { getCrmUserFromRequest, isGestorRole } from './_lib/crmAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const crmUser = await getCrmUserFromRequest(req, res);
  if (!crmUser) return;

  const leadId = typeof req.query.lead_id === 'string' ? req.query.lead_id : '';
  if (!leadId) {
    return res.status(400).json({ error: 'lead_id é obrigatório' });
  }

  const [{ data: lead, error: leadError }, { data: events, error: eventsError }] = await Promise.all([
    supabase
      .from('leads')
      .select('*, sellers(name)')
      .eq('id', leadId)
      .maybeSingle(),
    supabase
      .from('lead_events')
      .select('id, event_type, actor_type, actor_phone, payload, created_at')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true }),
  ]);

  if (leadError || !lead) {
    return res.status(404).json({ error: 'Lead não encontrado.' });
  }

  if (!isGestorRole(crmUser.role) && crmUser.seller_id !== lead.assigned_seller_id) {
    return res.status(403).json({ error: 'Lead não atribuído a você.' });
  }

  if (eventsError) {
    return res.status(500).json({ error: eventsError.message });
  }

  return res.status(200).json({
    lead,
    events: events ?? [],
  });
}
