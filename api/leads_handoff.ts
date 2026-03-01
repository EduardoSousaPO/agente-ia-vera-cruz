import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';

async function triggerSync(): Promise<void> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://agente-ia-vera-cruz.vercel.app';
  const syncToken = process.env.SYNC_TOKEN || '';
  
  await fetch(`${baseUrl}/api/sync_conversations?token=${syncToken}`, { method: 'GET' });
}

function shortId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 6).toUpperCase();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NotificationResult {
  sent: boolean;
  attempts: number;
  status_code?: number;
  error?: string;
}

interface HandoffResult {
  lead_id: string;
  handoff_short_id: string;
  assigned_seller_name: string;
  assigned_seller_phone: string;
  seller_message_text: string;
  whatsapp_notification_sent: boolean;
  notification_attempts: number;
  notification_status_code?: number;
  notification_error?: string;
  already_assigned?: boolean;
}

interface ExecuteHandoffInput {
  lead_phone: string;
  lead_name?: string;
  lead_city?: string;
  lead_model_interest?: string;
  lead_payment_method?: string;
  lead_email?: string;
  lead_cpf?: string;
  lead_birth_date?: string;
  lead_down_payment?: string;
  source?: 'handoff_api' | 'qualify_auto';
  skip_if_already_assigned?: boolean;
}

async function sendWhatsAppToSeller(sellerPhone: string, message: string): Promise<{
  ok: boolean;
  status?: number;
  error?: string;
}> {
  const apiKey = process.env.SUPERAGENTES_API_KEY;
  const agentId = process.env.SUPERAGENTES_AGENT_ID;

  if (!apiKey || !agentId) {
    console.error('SUPERAGENTES_API_KEY ou SUPERAGENTES_AGENT_ID não configurados');
    return { ok: false, error: 'SUPERAGENTES_API_KEY ou SUPERAGENTES_AGENT_ID não configurados' };
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
      return { ok: false, status: response.status, error: errorData || 'erro_superagentes' };
    }

    console.log('Mensagem enviada ao vendedor com sucesso');
    return { ok: true, status: response.status };
  } catch (err) {
    console.error('Erro ao chamar API Super Agentes:', err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'erro_desconhecido_superagentes',
    };
  }
}

async function sendWithRetry(sellerPhone: string, message: string, maxAttempts = 3): Promise<NotificationResult> {
  let lastError: string | undefined;
  let statusCode: number | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await sendWhatsAppToSeller(sellerPhone, message);
    statusCode = result.status;
    if (result.ok) {
      return { sent: true, attempts: attempt, status_code: statusCode };
    }
    lastError = result.error ?? 'erro_envio';
    if (attempt < maxAttempts) {
      await sleep(400 * attempt);
    }
  }
  return {
    sent: false,
    attempts: maxAttempts,
    status_code: statusCode,
    error: lastError,
  };
}

function isFinanced(paymentMethod: string | null | undefined): boolean {
  return (paymentMethod ?? '').toLowerCase().includes('financ');
}

export async function executeLeadHandoff(input: ExecuteHandoffInput): Promise<HandoffResult> {
  const lead_phone = input.lead_phone?.trim();
  if (!lead_phone) {
    throw new Error('lead_phone é obrigatório');
  }

  const selectFields =
    'id, lead_name, lead_phone, lead_city, lead_model_interest, lead_timeframe, lead_payment_method, lead_email, lead_cpf, lead_birth_date, lead_down_payment, handoff_short_id, assigned_seller_id, assigned_at, handoff_at';

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
        lead_name: input.lead_name ?? null,
        lead_city: input.lead_city ?? null,
        lead_model_interest: input.lead_model_interest ?? null,
        lead_payment_method: input.lead_payment_method ?? null,
        lead_email: input.lead_email ?? null,
        lead_cpf: input.lead_cpf ?? null,
        lead_birth_date: input.lead_birth_date ?? null,
        lead_down_payment: input.lead_down_payment ?? null,
        lead_stage: 'new',
      })
      .select(selectFields)
      .single();

    if (insertError || !newLead) {
      console.error('leads_handoff insert error:', insertError);
      throw new Error('Erro ao criar lead');
    }

    await supabase.from('leads').update({ handoff_short_id: shortId(newLead.id) }).eq('id', newLead.id);
    lead = { ...newLead, handoff_short_id: shortId(newLead.id) };
  }

  if (input.skip_if_already_assigned && lead.assigned_seller_id && lead.handoff_short_id) {
    const { data: existingSeller } = await supabase
      .from('sellers')
      .select('name, phone_e164, phone')
      .eq('id', lead.assigned_seller_id)
      .maybeSingle();
    return {
      lead_id: lead.id,
      handoff_short_id: lead.handoff_short_id,
      assigned_seller_name: existingSeller?.name ?? 'Vendedor já atribuído',
      assigned_seller_phone: existingSeller?.phone_e164 ?? existingSeller?.phone ?? '',
      seller_message_text: '',
      whatsapp_notification_sent: true,
      notification_attempts: 0,
      already_assigned: true,
    };
  }

  const { data: sellerId, error: rpcError } = await supabase.rpc('assign_seller_round_robin');
  if (rpcError || !sellerId) {
    console.error('assign_seller_round_robin error:', rpcError);
    throw new Error('Nenhum vendedor ativo disponível');
  }

  const handoff_short_id = lead.handoff_short_id ?? shortId(lead.id);
  const now = new Date().toISOString();

  const { data: seller, error: sellerError } = await supabase
    .from('sellers')
    .select('id, name, phone_e164, phone')
    .eq('id', sellerId)
    .single();

  if (sellerError || !seller) {
    throw new Error('Vendedor não encontrado');
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
    throw new Error(updateError.message);
  }

  await supabase.from('lead_events').insert({
    lead_id: lead.id,
    event_type: 'handoff',
    actor_type: 'system',
    actor_phone: phoneDisplay,
    payload: { assigned_seller_id: seller.id, source: input.source ?? 'handoff_api' },
  });

  const link = `https://wa.me/${lead.lead_phone?.replace(/^\+/, '')}`;
  let seller_message_text = '🚗 *NOVO LEAD QUALIFICADO*\n\n';
  seller_message_text += `*Nome:* ${lead.lead_name ?? 'N/A'}\n`;
  seller_message_text += `*Telefone:* ${lead.lead_phone}\n`;
  seller_message_text += `*Email:* ${lead.lead_email ?? 'N/A'}\n`;
  seller_message_text += `*Cidade:* ${lead.lead_city ?? 'N/A'}\n`;
  seller_message_text += `*Modelo:* ${lead.lead_model_interest ?? 'N/A'}\n`;
  seller_message_text += `*Pagamento:* ${lead.lead_payment_method ?? 'N/A'}\n`;

  if (isFinanced(lead.lead_payment_method)) {
    seller_message_text += `*Entrada:* R$ ${lead.lead_down_payment ?? 'N/A'}\n`;
    seller_message_text += `*CPF:* ${lead.lead_cpf ?? 'N/A'}\n`;
    seller_message_text += `*Nascimento:* ${lead.lead_birth_date ?? 'N/A'}\n`;
  }

  seller_message_text += `\n*ID:* ${handoff_short_id}\n`;
  seller_message_text += `*Link WhatsApp:* ${link}\n\n`;
  seller_message_text += 'Responda com o comando + ID:\n';
  seller_message_text += `1 ${handoff_short_id} = Aceitar\n`;
  seller_message_text += `2 ${handoff_short_id} = Agendar visita\n`;
  seller_message_text += `3 ${handoff_short_id} = Venda realizada\n`;
  seller_message_text += `4 ${handoff_short_id} = Não conseguiu contato`;

  const sellerPhoneFormatted = seller.phone_e164 ?? seller.phone;
  const notification = await sendWithRetry(sellerPhoneFormatted, seller_message_text, 3);

  await supabase.from('lead_events').insert({
    lead_id: lead.id,
    event_type: 'handoff_notification',
    actor_type: 'system',
    actor_phone: phoneDisplay,
    payload: {
      source: input.source ?? 'handoff_api',
      sent: notification.sent,
      attempts: notification.attempts,
      status_code: notification.status_code ?? null,
      error: notification.error ?? null,
    },
  });

  if (!notification.sent) {
    console.error('Falha ao notificar vendedor após retries:', {
      lead_id: lead.id,
      attempts: notification.attempts,
      status_code: notification.status_code,
      error: notification.error,
    });
  }

  return {
    lead_id: lead.id,
    handoff_short_id,
    assigned_seller_name: seller.name,
    assigned_seller_phone: phoneDisplay,
    seller_message_text,
    whatsapp_notification_sent: notification.sent,
    notification_attempts: notification.attempts,
    notification_status_code: notification.status_code,
    notification_error: notification.error,
  };
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

    const result = await executeLeadHandoff({
      lead_phone,
      lead_name: body.lead_name,
      lead_city: body.lead_city,
      lead_model_interest: body.lead_model_interest,
      lead_payment_method: body.lead_payment_method,
      lead_email: body.lead_email,
      lead_cpf: body.lead_cpf,
      lead_birth_date: body.lead_birth_date,
      lead_down_payment: body.lead_down_payment,
      source: 'handoff_api',
      skip_if_already_assigned: false,
    });

    triggerSync().catch((err) => console.error('Sync trigger error:', err));

    return res.status(200).json(result);
  } catch (err) {
    console.error('leads_handoff unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
