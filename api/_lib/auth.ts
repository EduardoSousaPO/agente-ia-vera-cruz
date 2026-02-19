import type { VercelRequest, VercelResponse } from '@vercel/node';

const HEADER = 'x-crm-api-key';

/**
 * Valida o header X-CRM-API-KEY. Se inválido, envia 401 e retorna false.
 */
export function requireCrmApiKey(req: VercelRequest, res: VercelResponse): boolean {
  const key = req.headers[HEADER] ?? req.headers['X-CRM-API-KEY'];
  const secret = process.env.CRM_API_KEY;
  if (!secret || key !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
