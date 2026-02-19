import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../lib/supabase';

type Lead = {
  id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_city: string | null;
  lead_stage: string | null;
  lead_model_interest: string | null;
  created_at: string;
};

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtroStage, setFiltroStage] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = supabase
      .from('leads')
      .select('id, lead_phone, lead_name, lead_city, lead_stage, lead_model_interest, created_at')
      .order('created_at', { ascending: false });

    if (filtroStage) q = q.eq('lead_stage', filtroStage);
    if (busca.trim()) {
      q = q.or(`lead_name.ilike.%${busca.trim()}%,lead_phone.ilike.%${busca.trim()}%`);
    }

    q.then(({ data, error }) => {
      setLoading(false);
      if (error) return;
      setLeads((data as Lead[]) ?? []);
    });
  }, [filtroStage, busca]);

  const stages = ['new', 'qualified', 'handoff_sent', 'in_contact', 'follow_up', 'lost', 'won'];

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to="/leads">Leads</Link> | <Link to="/metricas">Métricas</Link>
      </nav>
      <h1>Leads</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <select
          value={filtroStage}
          onChange={(e) => setFiltroStage(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="">Todos os estágios</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Buscar nome ou telefone"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ padding: 8, minWidth: 200 }}
        />
      </div>
      {loading ? (
        <p>Carregando…</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Nome</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Telefone</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Cidade</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Estágio</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Modelo</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Data</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>
                  <Link to={`/leads/${l.id}`}>{l.lead_name || '—'}</Link>
                </td>
                <td style={{ padding: 8 }}>{l.lead_phone}</td>
                <td style={{ padding: 8 }}>{l.lead_city || '—'}</td>
                <td style={{ padding: 8 }}>{l.lead_stage || '—'}</td>
                <td style={{ padding: 8 }}>{l.lead_model_interest || '—'}</td>
                <td style={{ padding: 8 }}>
                  {l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && leads.length === 0 && <p>Nenhum lead encontrado.</p>}
    </div>
  );
}
