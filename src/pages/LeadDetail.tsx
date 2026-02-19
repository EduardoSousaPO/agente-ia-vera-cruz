import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import supabase from '../lib/supabase';

type Lead = {
  id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_city: string | null;
  lead_model_interest: string | null;
  lead_timeframe: string | null;
  lead_payment_method: string | null;
  lead_has_cnpj: string | null;
  lead_best_contact_time: string | null;
  lead_notes: string | null;
  lead_stage: string | null;
  handoff_short_id: string | null;
  qualified_at: string | null;
  handoff_at: string | null;
  created_at: string;
  updated_at: string;
};

type Event = {
  id: string;
  event_type: string;
  actor_type: string | null;
  actor_phone: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) return;
        setLead(data as Lead);
      });

    supabase
      .from('lead_events')
      .select('id, event_type, actor_type, actor_phone, payload, created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setEvents((data as Event[]) ?? []));

    setLoading(false);
  }, [id]);

  if (loading || !lead) {
    return (
      <div style={{ padding: 24 }}>
        <Link to="/leads">← Voltar</Link>
        <p>Carregando…</p>
      </div>
    );
  }

  const campos = [
    { label: 'Nome', value: lead.lead_name },
    { label: 'Telefone', value: lead.lead_phone },
    { label: 'Cidade', value: lead.lead_city },
    { label: 'Modelo de interesse', value: lead.lead_model_interest },
    { label: 'Prazo', value: lead.lead_timeframe },
    { label: 'Pagamento', value: lead.lead_payment_method },
    { label: 'CNPJ/MEI', value: lead.lead_has_cnpj },
    { label: 'Melhor horário', value: lead.lead_best_contact_time },
    { label: 'Observações', value: lead.lead_notes },
    { label: 'Estágio', value: lead.lead_stage },
    { label: 'ID curto (comandos)', value: lead.handoff_short_id },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 700, margin: '0 auto' }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to="/leads">← Voltar para lista</Link>
      </nav>
      <h1>Lead — {lead.lead_name || lead.lead_phone}</h1>
      <section style={{ marginBottom: 32 }}>
        <h2>Dados</h2>
        <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 16px' }}>
          {campos.map(({ label, value }) => (
            <React.Fragment key={label}>
              <dt style={{ color: '#666' }}>{label}</dt>
              <dd style={{ margin: 0 }}>{value ?? '—'}</dd>
            </React.Fragment>
          ))}
        </dl>
        {lead.qualified_at && (
          <p style={{ color: '#666', marginTop: 8 }}>
            Qualificado em {new Date(lead.qualified_at).toLocaleString('pt-BR')}
          </p>
        )}
      </section>
      <section>
        <h2>Timeline</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((e) => (
            <li
              key={e.id}
              style={{
                borderLeft: '3px solid #ddd',
                paddingLeft: 12,
                marginBottom: 12,
              }}
            >
              <strong>{e.event_type}</strong>
              {e.actor_type && ` (${e.actor_type})`}
              {e.actor_phone && ` — ${e.actor_phone}`}
              <br />
              <small>{new Date(e.created_at).toLocaleString('pt-BR')}</small>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <pre style={{ fontSize: 12, marginTop: 4 }}>{JSON.stringify(e.payload)}</pre>
              )}
            </li>
          ))}
        </ul>
        {events.length === 0 && <p>Nenhum evento registrado.</p>}
      </section>
    </div>
  );
}
