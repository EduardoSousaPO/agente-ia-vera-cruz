import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/db.js';
import { getCrmUserFromRequest, isGestorRole } from './_lib/crmAuth.js';

function parseBoolean(value: string | string[] | undefined): boolean {
  return value === 'true';
}

function parseString(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isLeadStalled(lead: { handoff_at: string | null; seller_first_action_at: string | null }) {
  if (!lead.handoff_at || lead.seller_first_action_at) return false;
  return new Date(lead.handoff_at).getTime() <= Date.now() - 24 * 60 * 60 * 1000;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const crmUser = await getCrmUserFromRequest(req, res);
  if (!crmUser) return;

  const isGestor = isGestorRole(crmUser.role);
  const stage = parseString(req.query.stage);
  const sellerId = parseString(req.query.seller_id);
  const model = parseString(req.query.model);
  const payment = parseString(req.query.payment);
  const city = parseString(req.query.city);
  const search = parseString(req.query.search).replace(/[%]/g, '');
  const periodDays = parseString(req.query.period_days);
  const onlyNoContact = parseBoolean(req.query.only_no_contact);
  const onlyUnassigned = parseBoolean(req.query.only_unassigned);
  const page = Math.max(Number(parseString(req.query.page) || '1') || 1, 1);
  const pageSize = Math.min(Math.max(Number(parseString(req.query.page_size) || '60') || 60, 1), 200);
  const mode = parseString(req.query.mode) || 'list';

  let query = supabase
    .from('leads')
    .select(
      'id, lead_phone, lead_name, lead_city, lead_stage, lead_model_interest, lead_payment_method, assigned_seller_id, handoff_at, seller_first_action_at, last_contact_at, created_at, sellers(id, name)',
    )
    .order('created_at', { ascending: false });

  if (crmUser.role === 'vendedor' && crmUser.seller_id) {
    query = query.eq('assigned_seller_id', crmUser.seller_id);
  }

  if (isGestor && onlyUnassigned) {
    query = query.is('assigned_seller_id', null);
  } else if (isGestor && sellerId) {
    query = query.eq('assigned_seller_id', sellerId);
  }

  if (stage) query = query.eq('lead_stage', stage);
  if (model) query = query.ilike('lead_model_interest', `%${model}%`);
  if (payment) query = query.ilike('lead_payment_method', `%${payment}%`);
  if (city) query = query.ilike('lead_city', `%${city}%`);

  if (periodDays) {
    const days = Number(periodDays);
    if (!Number.isNaN(days)) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      query = query.gte('created_at', cutoff.toISOString());
    }
  }

  if (search) {
    query = query.or(
      `lead_name.ilike.%${search}%,lead_phone.ilike.%${search}%,lead_city.ilike.%${search}%,lead_model_interest.ilike.%${search}%`,
    );
  }

  if (mode === 'list') {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    query = query.range(start, end);
  } else {
    query = query.range(0, 499);
  }

  const [{ data: leads, error: leadsError }, sellersResult] = await Promise.all([
    query,
    isGestor
      ? supabase.from('sellers').select('id, name').eq('is_active', true).order('name', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (leadsError) {
    return res.status(500).json({ error: leadsError.message });
  }

  const rawLeads = (leads ?? []) as Array<Record<string, unknown> & { handoff_at: string | null; seller_first_action_at: string | null }>;
  const filteredLeads = onlyNoContact ? rawLeads.filter(isLeadStalled) : rawLeads;

  return res.status(200).json({
    leads: filteredLeads,
    sellers: sellersResult.data ?? [],
    has_next_page: mode === 'list' && rawLeads.length === pageSize,
  });
}
