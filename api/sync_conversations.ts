import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/db.js';

interface SuperAgentesConversation {
  id: string;
  channel: string;
  channelExternalId?: string;
  contact?: {
    phone?: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
}

function getLast8Digits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const syncToken = process.env.SYNC_TOKEN;
  const providedToken = req.headers['x-sync-token'] || req.query.token;
  
  if (syncToken && providedToken !== syncToken) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const apiKey = process.env.SUPERAGENTES_API_KEY;
  const agentId = process.env.SUPERAGENTES_AGENT_ID;

  if (!apiKey || !agentId) {
    return res.status(500).json({ error: 'SUPERAGENTES_API_KEY ou SUPERAGENTES_AGENT_ID não configurados' });
  }

  try {
    const response = await fetch(
      `https://dash.superagentes.ai/api/user-conversations?agentId=${agentId}&channel=whatsapp&simplified=true`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao buscar conversas:', response.status, errorText);
      return res.status(500).json({ error: 'Erro ao buscar conversas do Super Agentes' });
    }

    const conversations: SuperAgentesConversation[] = await response.json();
    
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const conv of conversations) {
      if (conv.channel !== 'whatsapp') {
        skipped++;
        continue;
      }

      const phone = conv.contact?.phone || conv.channelExternalId;
      if (!phone) {
        console.log(`[sync] Conversa sem telefone: id=${conv.id}`);
        skipped++;
        continue;
      }

      const last8 = getLast8Digits(phone);
      const name = conv.contact?.name || null;
      const email = conv.contact?.email || null;

      console.log(`[sync] Processando conversa: phone=${phone}, last8=${last8}, name=${name}`);

      const { data: existing } = await supabase
        .from('leads')
        .select('id, lead_name, lead_email, lead_phone')
        .like('lead_phone', `%${last8}`)
        .maybeSingle();

      if (existing) {
        console.log(`[sync] Lead já existe: id=${existing.id}`);
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        
        if (name && !existing.lead_name) {
          updates.lead_name = name;
        }
        if (email && !existing.lead_email) {
          updates.lead_email = email;
        }

        if (Object.keys(updates).length > 1) {
          await supabase.from('leads').update(updates).eq('id', existing.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        console.log(`[sync] Lead não encontrado, criando novo...`);
        const phoneDigits = phone.replace(/\D/g, '');
        const normalizedPhone = phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits;
        
        const { data: newLead, error: insertError } = await supabase
          .from('leads')
          .insert({
            lead_phone: normalizedPhone,
            lead_name: name,
            lead_email: email,
            lead_stage: 'new',
            source: 'whatsapp',
            conversation_id: conv.id,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Erro ao criar lead:', insertError);
          skipped++;
          continue;
        }

        if (newLead) {
          await supabase.from('leads').update({ handoff_short_id: shortId(newLead.id) }).eq('id', newLead.id);
          created++;
        }
      }
    }

    return res.status(200).json({
      ok: true,
      total_conversations: conversations.length,
      created,
      updated,
      skipped,
    });
  } catch (err) {
    console.error('sync_conversations error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
