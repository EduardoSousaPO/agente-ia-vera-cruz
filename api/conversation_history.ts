import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_lib/db.js';

interface Message {
  id: string;
  text: string;
  from: 'human' | 'agent';
  isAgent: boolean;
  timestamp: string;
}

interface SuperAgentesConversation {
  id: string;
  contact?: {
    phone?: string;
    name?: string;
  };
  messages: Message[];
}

function getLast8Digits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-8);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lead_id } = req.query;
  if (!lead_id || typeof lead_id !== 'string') {
    return res.status(400).json({ error: 'lead_id é obrigatório' });
  }

  const apiKey = process.env.SUPERAGENTES_API_KEY;
  const agentId = process.env.SUPERAGENTES_AGENT_ID;

  if (!apiKey || !agentId) {
    return res.status(500).json({ error: 'SUPERAGENTES_API_KEY ou SUPERAGENTES_AGENT_ID não configurados' });
  }

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('lead_phone, conversation_id')
      .eq('id', lead_id)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

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
      return res.status(500).json({ error: 'Erro ao buscar conversas do Super Agentes' });
    }

    const conversations: SuperAgentesConversation[] = await response.json();
    
    const last8 = getLast8Digits(lead.lead_phone);
    
    let matchingConversation: SuperAgentesConversation | null = null;
    
    if (lead.conversation_id) {
      matchingConversation = conversations.find(c => c.id === lead.conversation_id) || null;
    }
    
    if (!matchingConversation) {
      matchingConversation = conversations.find(c => {
        const convPhone = c.contact?.phone;
        if (!convPhone) return false;
        return getLast8Digits(convPhone) === last8;
      }) || null;
    }

    if (!matchingConversation) {
      return res.status(200).json({ messages: [], contact_name: null });
    }

    if (!lead.conversation_id && matchingConversation.id) {
      await supabase
        .from('leads')
        .update({ conversation_id: matchingConversation.id })
        .eq('id', lead_id);
    }

    const messages = matchingConversation.messages.map(m => ({
      id: m.id,
      text: m.text,
      from: m.isAgent ? 'agent' : 'human',
      timestamp: m.timestamp,
    }));

    return res.status(200).json({
      messages,
      contact_name: matchingConversation.contact?.name || null,
    });
  } catch (err) {
    console.error('conversation_history error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
