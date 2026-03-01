import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCrmApiKey } from './_lib/auth.js';
import { supabase } from './_lib/db.js';
import { executeLeadHandoff } from './leads_handoff.js';

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

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
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

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      lead_name: body.lead_name ?? undefined,
      lead_city: body.lead_city ?? undefined,
      lead_model_interest: body.lead_model_interest ?? undefined,
      lead_timeframe: body.lead_timeframe ?? undefined,
      lead_payment_method: body.lead_payment_method ?? undefined,
      lead_has_cnpj: body.lead_has_cnpj ?? undefined,
      lead_best_contact_time: body.lead_best_contact_time ?? undefined,
      lead_notes: body.lead_notes ?? undefined,
    };
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    // Primeiro, tenta encontrar o lead existente
    const { data: existing } = await supabase
      .from('leads')
      .select(
        'id, lead_stage, lead_city, lead_model_interest, lead_timeframe, lead_payment_method, qualified_at, assigned_seller_id'
      )
      .eq('lead_phone', lead_phone)
      .maybeSingle();

    let lead;

    if (existing) {
      // Lead existe, faz update
      const { data: updated, error } = await supabase
        .from('leads')
        .update(update)
        .eq('lead_phone', lead_phone)
        .select(
          'id, lead_stage, lead_city, lead_model_interest, lead_timeframe, lead_payment_method, qualified_at, assigned_seller_id'
        )
        .single();

      if (error || !updated) {
        console.error('leads_qualify update error:', error);
        return res.status(500).json({ error: 'Erro ao atualizar lead' });
      }
      lead = updated;
    } else {
      // Lead não existe, cria um novo
      const insertPayload = {
        lead_phone,
        lead_name: body.lead_name ?? null,
        lead_city: body.lead_city ?? null,
        lead_model_interest: body.lead_model_interest ?? null,
        lead_timeframe: body.lead_timeframe ?? null,
        lead_payment_method: body.lead_payment_method ?? null,
        lead_has_cnpj: body.lead_has_cnpj ?? null,
        lead_best_contact_time: body.lead_best_contact_time ?? null,
        lead_notes: body.lead_notes ?? null,
        lead_stage: 'new',
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('leads')
        .insert(insertPayload)
        .select(
          'id, lead_stage, lead_city, lead_model_interest, lead_timeframe, lead_payment_method, qualified_at, assigned_seller_id'
        )
        .single();

      if (insertError || !inserted) {
        console.error('leads_qualify insert error:', insertError);
        return res.status(500).json({ error: 'Erro ao criar lead' });
      }

      // Gera o short_id para o novo lead
      await supabase.from('leads').update({ handoff_short_id: shortId(inserted.id) }).eq('id', inserted.id);
      lead = inserted;
    }

    const hasRequired =
      hasValue(lead.lead_city) &&
      hasValue(lead.lead_model_interest) &&
      hasValue(lead.lead_payment_method);
    let lead_stage = lead.lead_stage ?? 'new';
    let auto_handoff_triggered = false;
    let auto_handoff_error: string | null = null;
    let whatsapp_notification_sent: boolean | null = null;

    if (hasRequired && !lead.qualified_at) {
      const { error: qualifyError } = await supabase
        .from('leads')
        .update({
          qualified_at: new Date().toISOString(),
          lead_stage: 'qualified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);
      if (qualifyError) {
        console.error('leads_qualify stage update error:', qualifyError);
      }
      lead_stage = 'qualified';
      await supabase.from('lead_events').insert({
        lead_id: lead.id,
        event_type: 'qualification_update',
        actor_type: 'system',
        payload: { source: 'leads_qualify' },
      });

      // Blindagem do fluxo: ao qualificar, dispara handoff automaticamente.
      if (!lead.assigned_seller_id) {
        auto_handoff_triggered = true;
        try {
          const handoffResult = await executeLeadHandoff({
            lead_phone,
            lead_name: body.lead_name,
            lead_city: body.lead_city,
            lead_model_interest: body.lead_model_interest,
            lead_payment_method: body.lead_payment_method,
            lead_email: body.lead_email,
            lead_cpf: body.lead_cpf,
            lead_birth_date: body.lead_birth_date,
            lead_down_payment: body.lead_down_payment,
            source: 'qualify_auto',
            skip_if_already_assigned: true,
          });
          lead_stage = 'handoff_sent';
          whatsapp_notification_sent = handoffResult.whatsapp_notification_sent;
        } catch (handoffErr) {
          auto_handoff_error = handoffErr instanceof Error ? handoffErr.message : 'Erro no handoff automático';
          await supabase.from('lead_events').insert({
            lead_id: lead.id,
            event_type: 'qualification_handoff_error',
            actor_type: 'system',
            payload: { error: auto_handoff_error },
          });
          console.error('Erro no handoff automático após qualificação:', handoffErr);
        }
      }
    }

    triggerSync().catch(err => console.error('Sync trigger error:', err));

    return res.status(200).json({
      lead_id: lead.id,
      lead_stage,
      auto_handoff_triggered,
      auto_handoff_error,
      whatsapp_notification_sent,
    });
  } catch (err) {
    console.error('leads_qualify unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
