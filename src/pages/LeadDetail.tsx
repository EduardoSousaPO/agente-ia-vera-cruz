import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

type Lead = {
  id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_cpf: string | null;
  lead_birth_date: string | null;
  lead_city: string | null;
  lead_model_interest: string | null;
  lead_timeframe: string | null;
  lead_payment_method: string | null;
  lead_down_payment: string | null;
  lead_has_cnpj: string | null;
  lead_best_contact_time: string | null;
  lead_notes: string | null;
  lead_stage: string | null;
  handoff_short_id: string | null;
  qualified_at: string | null;
  handoff_at: string | null;
  assigned_seller_id: string | null;
  created_at: string;
  updated_at: string;
  sellers?: { name: string } | null;
};

type Event = {
  id: string;
  event_type: string;
  actor_type: string | null;
  actor_phone: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

type Message = {
  id: string;
  text: string;
  from: 'agent' | 'human';
  timestamp: string;
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isGestor, isVendedor } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!id || !supabase || !user) return;

    supabase
      .from('leads')
      .select('*, sellers(name)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setLoading(false);
          return;
        }
        
        const leadData = data as Lead;
        
        if (isVendedor && user.seller_id && leadData.assigned_seller_id !== user.seller_id) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        
        setLead(leadData);
        setLoading(false);
      });

    supabase
      .from('lead_events')
      .select('id, event_type, actor_type, actor_phone, payload, created_at')
      .eq('lead_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setEvents((data as Event[]) ?? []));

    fetch(`/api/conversation_history?lead_id=${id}`)
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setLoadingMessages(false);
      })
      .catch(() => setLoadingMessages(false));
  }, [id, user, isVendedor]);

  if (accessDenied) {
    return <Navigate to="/leads" replace />;
  }

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
    { label: 'Email', value: lead.lead_email },
    { label: 'CPF', value: lead.lead_cpf },
    { label: 'Data de Nascimento', value: lead.lead_birth_date },
    { label: 'Cidade', value: lead.lead_city },
    { label: 'Modelo de interesse', value: lead.lead_model_interest },
    { label: 'Forma de Pagamento', value: lead.lead_payment_method },
    { label: 'Valor de Entrada', value: lead.lead_down_payment ? `R$ ${lead.lead_down_payment}` : null },
    { label: 'Prazo', value: lead.lead_timeframe },
    { label: 'CNPJ/MEI', value: lead.lead_has_cnpj },
    { label: 'Melhor horário', value: lead.lead_best_contact_time },
    { label: 'Observações', value: lead.lead_notes },
    { label: 'Estágio', value: lead.lead_stage },
    { label: 'ID curto (comandos)', value: lead.handoff_short_id },
  ];

  if (isGestor) {
    campos.push({ label: 'Vendedor atribuído', value: lead.sellers?.name || null });
  }

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
      <section className="panel section-gap">
        <div className="panel-inner">
        <h2>Histórico da Conversa</h2>
        {loadingMessages ? (
          <p className="empty-state">Carregando mensagens…</p>
        ) : messages.length === 0 ? (
          <p className="empty-state">Nenhuma mensagem encontrada.</p>
        ) : (
          <div className="chat-history">
            {messages.map((m) => (
              <div key={m.id} className={`chat-message ${m.from === 'agent' ? 'chat-message--agent' : 'chat-message--human'}`}>
                <div className="chat-bubble">
                  <p className="chat-text">{m.text}</p>
                  <small className="chat-time">
                    {new Date(m.timestamp).toLocaleString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-inner">
        <h2>Timeline de Eventos</h2>
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
