import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth';
import { supabase } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireCrmApiKey(req, res)) return;

  const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : null;
  if (!phone) {
    return res.status(400).json({ error: 'Query phone (E.164) é obrigatório' });
  }

  const { data: seller } = await supabase
    .from('sellers')
    .select('id, name, phone_e164, phone')
    .or(`phone_e164.eq.${phone},phone.eq.${phone}`)
    .eq('is_active', true)
    .maybeSingle();

  if (seller) {
    return res.status(200).json({
      role: 'seller',
      seller: {
        id: seller.id,
        name: seller.name,
        phone_e164: seller.phone_e164 ?? seller.phone,
      },
    });
  }
  return res.status(200).json({ role: 'lead' });
}
