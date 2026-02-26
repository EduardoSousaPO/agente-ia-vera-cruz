import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

type Lead = {
  id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_city: string | null;
  lead_stage: string | null;
  lead_model_interest: string | null;
  lead_payment_method: string | null;
  created_at: string;
  sellers?: { name: string } | { name: string }[] | null;
};

export default function LeadsList() {
  const { user, isGestor, isVendedor } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtroStage, setFiltroStage] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    let q = supabase
      .from('leads')
      .select('id, lead_phone, lead_name, lead_city, lead_stage, lead_model_interest, lead_payment_method, created_at, assigned_seller_id, sellers(name)')
      .order('created_at', { ascending: false });

    if (isVendedor && user.seller_id) {
      q = q.eq('assigned_seller_id', user.seller_id);
    }

    if (filtroStage) q = q.eq('lead_stage', filtroStage);
    if (busca.trim()) {
      q = q.or(`lead_name.ilike.%${busca.trim()}%,lead_phone.ilike.%${busca.trim()}%`);
    }

    q.then(({ data, error }) => {
      setLoading(false);
      if (error) return;
      setLeads((data as Lead[]) ?? []);
    });
  }, [filtroStage, busca, user, isVendedor]);

  const stages = ['new', 'qualified', 'handoff_sent', 'in_contact', 'follow_up', 'lost', 'won'];

  return (
    <div>
      <header className="topbar">
        <div>
          <h1 className="page-title">
            {isVendedor ? 'Meus Leads' : 'Todos os Leads'}
          </h1>
          <p className="page-subtitle">
            {isVendedor 
              ? 'Leads atribuídos a você para atendimento.'
              : 'Lista viva do funil comercial com busca e filtros rápidos.'
            }
          </p>
        </div>
        {isGestor && (
          <Link to="/metricas" className="action-link">
            Ver métricas
          </Link>
        )}
      </header>
      <section className="panel">
        <div className="panel-inner">
      <div className="toolbar">
        <select
          className="select"
          value={filtroStage}
          onChange={(e) => setFiltroStage(e.target.value)}
        >
          <option value="">Todos os estágios</option>
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          className="input input--search"
          type="search"
          placeholder="Buscar nome ou telefone"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      {loading ? (
        <p className="empty-state">Carregando…</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Cidade</th>
              <th>Estágio</th>
              <th>Modelo</th>
              <th>Pagamento</th>
              {isGestor && <th>Vendedor</th>}
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link to={`/leads/${l.id}`}>{l.lead_name || '—'}</Link>
                </td>
                <td>{l.lead_phone}</td>
                <td>{l.lead_city || '—'}</td>
                <td>{l.lead_stage || '—'}</td>
                <td>{l.lead_model_interest || '—'}</td>
                <td>{l.lead_payment_method || '—'}</td>
                {isGestor && <td>{Array.isArray(l.sellers) ? l.sellers[0]?.name : l.sellers?.name || '—'}</td>}
                <td>
                  {l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && leads.length === 0 && (
        <p className="empty-state">
          {isVendedor 
            ? 'Nenhum lead atribuído a você ainda.'
            : 'Nenhum lead encontrado.'
          }
        </p>
      )}
        </div>
      </section>
    </div>
  );
}
