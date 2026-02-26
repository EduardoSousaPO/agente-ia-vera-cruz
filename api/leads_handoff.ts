import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
}

async function sendWhatsAppToSeller(sellerPhone: string, message: string): Promise<boolean> {
  const apiKey = process.env.SUPERAGENTES_API_KEY;
  const agentId = process.env.SUPERAGENTES_AGENT_ID;

  if (!apiKey || !agentId) {
    console.error('SUPERAGENTES_API_KEY ou SUPERAGENTES_AGENT_ID não configurados');
    return false;
  }

  try {
    const response = await fetch('https://dash.superagentes.ai/api/campaigns/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        agentId,
        name: `Handoff Lead - ${new Date().toISOString()}`,
        useAgentContacts: false,
        manualPhoneNumbers: [sellerPhone],
        message,
        autoDispatch: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro ao enviar mensagem Super Agentes:', response.status, errorData);
      return false;
    }

    console.log('Mensagem enviada ao vendedor com sucesso');
    return true;
  } catch (err) {
    console.error('Erro ao chamar API Super Agentes:', err);
    return false;
  }
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

    const selectFields = 'id, lead_name, lead_phone, lead_city, lead_model_interest, lead_timeframe, lead_payment_method, lead_email, lead_cpf, lead_birth_date, lead_down_payment';
    
    let { data: lead } = await supabase
      .from('leads')
      .select(selectFields)
      .eq('lead_phone', lead_phone)
      .maybeSingle();

    if (!lead) {
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          lead_phone,
          lead_name: body.lead_name ?? null,
          lead_city: body.lead_city ?? null,
          lead_model_interest: body.lead_model_interest ?? null,
          lead_payment_method: body.lead_payment_method ?? null,
          lead_email: body.lead_email ?? null,
          lead_cpf: body.lead_cpf ?? null,
          lead_birth_date: body.lead_birth_date ?? null,
          lead_down_payment: body.lead_down_payment ?? null,
          lead_stage: 'new',
        })
        .select(selectFields)
        .single();

      if (insertError || !newLead) {
        console.error('leads_handoff insert error:', insertError);
        return res.status(500).json({ error: 'Erro ao criar lead' });
      }

      await supabase.from('leads').update({ handoff_short_id: shortId(newLead.id) }).eq('id', newLead.id);
      lead = newLead;
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
    
    let seller_message_text = `🚗 *NOVO LEAD QUALIFICADO*\n\n`;
    seller_message_text += `*Nome:* ${lead.lead_name ?? 'N/A'}\n`;
    seller_message_text += `*Telefone:* ${lead.lead_phone}\n`;
    seller_message_text += `*Email:* ${lead.lead_email ?? 'N/A'}\n`;
    seller_message_text += `*Cidade:* ${lead.lead_city ?? 'N/A'}\n`;
    seller_message_text += `*Modelo:* ${lead.lead_model_interest ?? 'N/A'}\n`;
    seller_message_text += `*Pagamento:* ${lead.lead_payment_method ?? 'N/A'}\n`;
    
    if (lead.lead_payment_method === 'financiado') {
      seller_message_text += `*Entrada:* R$ ${lead.lead_down_payment ?? 'N/A'}\n`;
      seller_message_text += `*CPF:* ${lead.lead_cpf ?? 'N/A'}\n`;
      seller_message_text += `*Nascimento:* ${lead.lead_birth_date ?? 'N/A'}\n`;
    }
    
    seller_message_text += `\n*ID:* ${handoff_short_id}\n`;
    seller_message_text += `*Link WhatsApp:* ${link}\n\n`;
    seller_message_text += `Responda com o comando + ID:\n`;
    seller_message_text += `1 ${handoff_short_id} = Aceitar\n`;
    seller_message_text += `2 ${handoff_short_id} = Agendar visita\n`;
    seller_message_text += `3 ${handoff_short_id} = Venda realizada\n`;
    seller_message_text += `4 ${handoff_short_id} = Não conseguiu contato`;

    const sellerPhoneFormatted = seller.phone_e164 ?? seller.phone;
    const messageSent = await sendWhatsAppToSeller(sellerPhoneFormatted, seller_message_text);

    return res.status(200).json({
      lead_id: lead.id,
      handoff_short_id,
      assigned_seller_name: seller.name,
      assigned_seller_phone: phoneDisplay,
      seller_message_text,
      whatsapp_notification_sent: messageSent,
    });
  } catch (err) {
    console.error('leads_handoff unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
