import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (!requireCrmApiKey(req, res)) return;

    let phone: string | null = null;
    if (req.method === 'GET') {
      phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : null;
    } else {
      const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
      phone = typeof body.phone === 'string' ? body.phone.trim() : null;
    }
    if (!phone) {
      return res.status(400).json({ error: 'phone (E.164) é obrigatório' });
    }

    const { data: seller, error } = await supabase
      .from('sellers')
      .select('id, name, phone_e164, phone')
      .or(`phone_e164.eq.${phone},phone.eq.${phone}`)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('contacts_role error:', error);
      return res.status(500).json({ error: error.message });
    }

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
  } catch (err) {
    console.error('contacts_role unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
