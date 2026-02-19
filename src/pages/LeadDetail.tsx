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
    if (!id || !supabase) return;
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
      <div className="panel">
        <div className="panel-inner">
        <Link to="/leads" className="action-link">← Voltar</Link>
        <p className="empty-state">Carregando…</p>
        </div>
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
    <div>
      <header className="topbar">
        <div>
          <h1 className="page-title">Lead — {lead.lead_name || lead.lead_phone}</h1>
          <p className="page-subtitle">Visão consolidada de dados e histórico da conversa.</p>
        </div>
        <Link to="/leads" className="action-link">
          Voltar para lista
        </Link>
      </header>
      <section className="panel section-gap">
        <div className="panel-inner">
        <h2>Dados</h2>
        <dl className="lead-fields">
          {campos.map(({ label, value }) => (
            <React.Fragment key={label}>
              <dt className="muted">{label}</dt>
              <dd>{value ?? '—'}</dd>
            </React.Fragment>
          ))}
        </dl>
        {lead.qualified_at && (
          <p className="meta">
            Qualificado em {new Date(lead.qualified_at).toLocaleString('pt-BR')}
          </p>
        )}
        </div>
      </section>
      <section className="panel">
        <div className="panel-inner">
        <h2>Timeline</h2>
        <ul className="timeline">
          {events.map((e) => (
            <li key={e.id} className="timeline-item">
              <strong>{e.event_type}</strong>
              {e.actor_type && ` (${e.actor_type})`}
              {e.actor_phone && ` — ${e.actor_phone}`}
              <br />
              <small className="muted">{new Date(e.created_at).toLocaleString('pt-BR')}</small>
              {e.payload && Object.keys(e.payload).length > 0 && (
                <pre className="code-block">{JSON.stringify(e.payload)}</pre>
              )}
            </li>
          ))}
        </ul>
        {events.length === 0 && <p className="empty-state">Nenhum evento registrado.</p>}
        </div>
      </section>
    </div>
  );
}
