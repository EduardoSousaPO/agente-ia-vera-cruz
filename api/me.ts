import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCrmUserFromRequest, isGestorRole } from './_lib/crmAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const crmUser = await getCrmUserFromRequest(req, res);
  if (!crmUser) return;

  return res.status(200).json({
    email: crmUser.email,
    role: crmUser.role,
    name: crmUser.name,
    seller_id: crmUser.seller_id,
    isGestor: isGestorRole(crmUser.role),
    isVendedor: crmUser.role === 'vendedor',
  });
}
