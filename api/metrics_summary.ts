import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/db.js';
import { getCrmUserFromRequest, isGestorRole } from './_lib/crmAuth.js';

function parseString(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const crmUser = await getCrmUserFromRequest(req, res);
  if (!crmUser) return;

  const isGestor = isGestorRole(crmUser.role);
  const sellerId = parseString(req.query.seller_id);
  const periodDays = parseString(req.query.period_days);

  let query = supabase
    .from('leads')
    .select('id, created_at, qualified_at, handoff_at, seller_first_action_at, lead_stage, lead_model_interest, assigned_seller_id, sellers(name)');

  if (!isGestor && crmUser.seller_id) {
    query = query.eq('assigned_seller_id', crmUser.seller_id);
  } else if (isGestor && sellerId) {
    query = query.eq('assigned_seller_id', sellerId);
  }

  if (periodDays) {
    const days = Number(periodDays);
    if (!Number.isNaN(days)) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte('created_at', cutoff.toISOString());
    }
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ leads: data ?? [] });
}
