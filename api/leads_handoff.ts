import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';

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

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, lead_name, lead_phone, lead_city, lead_model_interest, lead_timeframe, lead_payment_method')
      .eq('lead_phone', lead_phone)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const { data: sellerId, error: rpcError } = await supabase.rpc('assign_seller_round_robin');
    if (rpcError || !sellerId) {
      console.error('assign_seller_round_robin error:', rpcError);
      return res.status(503).json({ error: 'Nenhum vendedor ativo disponível' });
    }

    const handoff_short_id = shortId(lead.id);
    const now = new Date().toISOString();

    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id, name, phone_e164, phone')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      return res.status(503).json({ error: 'Vendedor não encontrado' });
    }

    const phoneDisplay = seller.phone_e164 ?? seller.phone;

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        assigned_seller_id: seller.id,
        assigned_at: now,
        handoff_at: now,
        handoff_short_id,
        lead_stage: 'handoff_sent',
        updated_at: now,
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('leads_handoff update error:', updateError);
      return res.status(500).json({ error: updateError.message });
    }

    await supabase.from('lead_events').insert({
      lead_id: lead.id,
      event_type: 'handoff',
      actor_type: 'system',
      actor_phone: phoneDisplay,
      payload: { assigned_seller_id: seller.id },
    });

    const link = `https://wa.me/${lead.lead_phone?.replace(/^\+/, '')}`;
    const seller_message_text =
      `Novo lead qualificado: ${lead.lead_name ?? 'N/A'} | ${lead.lead_city ?? 'N/A'} | ${lead.lead_model_interest ?? 'N/A'} | ${lead.lead_timeframe ?? 'N/A'} | ${lead.lead_payment_method ?? 'N/A'}\n` +
      `ID: ${handoff_short_id}\nContato: ${link}`;

    return res.status(200).json({
      lead_id: lead.id,
      handoff_short_id,
      assigned_seller_name: seller.name,
      assigned_seller_phone: phoneDisplay,
      seller_message_text,
    });
  } catch (err) {
    console.error('leads_handoff unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
