import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../lib/supabase';

type Lead = {
  id: string;
  created_at: string;
  qualified_at: string | null;
  handoff_at: string | null;
  seller_first_action_at: string | null;
  lead_stage: string | null;
  lead_model_interest: string | null;
  assigned_seller_id: string | null;
  sellers?: { name: string } | { name: string }[] | null;
};

export default function Metricas() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [periodo, setPeriodo] = useState<'7' | '30' | '90' | 'all'>('30');
  const [sellerId, setSellerId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('leads')
      .select('id, created_at, qualified_at, handoff_at, seller_first_action_at, lead_stage, lead_model_interest, assigned_seller_id, sellers(name)')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Falha ao carregar métricas.');
          setLoading(false);
          return;
        }
        setLeads((data as Lead[]) ?? []);
        setLoading(false);
      });
  }, []);

  const sellerOptions = useMemo(() => {
    const map = new Map<string, string>();
    leads.forEach((lead) => {
      if (!lead.assigned_seller_id) return;
      const sellerName = Array.isArray(lead.sellers)
        ? lead.sellers[0]?.name
        : lead.sellers?.name;
      map.set(lead.assigned_seller_id, sellerName ?? 'Sem nome');
    });
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [leads]);

  const leadsFiltrados = useMemo(() => {
    let next = [...leads];

    if (periodo !== 'all') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - Number(periodo));
      next = next.filter((lead) => new Date(lead.created_at).getTime() >= cutoff.getTime());
    }

    if (sellerId) {
      next = next.filter((lead) => lead.assigned_seller_id === sellerId);
    }

    return next;
  }, [leads, periodo, sellerId]);

  const comQualificacao = leadsFiltrados.filter((lead) => lead.qualified_at);
  const comHandoff = leadsFiltrados.filter((lead) => lead.handoff_at);
  const comPrimeiroContato = leadsFiltrados.filter((lead) => lead.seller_first_action_at && lead.handoff_at);
  const won = leadsFiltrados.filter((lead) => lead.lead_stage === 'won');
  const emAberto = leadsFiltrados.filter((lead) => lead.lead_stage !== 'won' && lead.lead_stage !== 'lost');
  const semContato24h = leadsFiltrados.filter((lead) => {
    if (!lead.handoff_at || lead.seller_first_action_at) return false;
    const handoffTs = new Date(lead.handoff_at).getTime();
    return handoffTs <= Date.now() - 24 * 60 * 60 * 1000;
  });

  const mediaTempoQualificacao = comQualificacao.length > 0
    ? comQualificacao.reduce((acc, lead) => {
      const created = new Date(lead.created_at).getTime();
      const qualified = new Date(lead.qualified_at!).getTime();
      return acc + (qualified - created) / 1000 / 60;
    }, 0) / comQualificacao.length
    : 0;

  const mediaTempoPrimeiroContato = comPrimeiroContato.length > 0
    ? comPrimeiroContato.reduce((acc, lead) => {
      const handoff = new Date(lead.handoff_at!).getTime();
      const first = new Date(lead.seller_first_action_at!).getTime();
      return acc + (first - handoff) / 1000 / 60;
    }, 0) / comPrimeiroContato.length
    : 0;

  const conversao = comHandoff.length > 0 ? (won.length / comHandoff.length) * 100 : 0;

  const porModelo: Record<string, number> = {};
  leadsFiltrados.forEach((lead) => {
    const model = lead.lead_model_interest || 'Não informado';
    porModelo[model] = (porModelo[model] ?? 0) + 1;
  });

  const porVendedor = useMemo(() => {
    const rows = new Map<string, {
      sellerName: string;
      recebidos: number;
      contatoNoSla: number;
      emAberto: number;
      ganhos: number;
    }>();

    leadsFiltrados.forEach((lead) => {
      if (!lead.assigned_seller_id) return;

      const sellerName = Array.isArray(lead.sellers)
        ? lead.sellers[0]?.name ?? 'Sem nome'
        : lead.sellers?.name ?? 'Sem nome';

      if (!rows.has(lead.assigned_seller_id)) {
        rows.set(lead.assigned_seller_id, {
          sellerName,
          recebidos: 0,
          contatoNoSla: 0,
          emAberto: 0,
          ganhos: 0,
        });
      }

      const row = rows.get(lead.assigned_seller_id)!;
      if (lead.handoff_at) {
        row.recebidos += 1;
      }
      if (lead.handoff_at && lead.seller_first_action_at) {
        const first = new Date(lead.seller_first_action_at).getTime();
        const handoff = new Date(lead.handoff_at).getTime();
        const minutes = (first - handoff) / 1000 / 60;
        if (minutes <= 24 * 60) {
          row.contatoNoSla += 1;
        }
      }
      if (lead.lead_stage === 'won') {
        row.ganhos += 1;
      }
      if (lead.lead_stage !== 'won' && lead.lead_stage !== 'lost') {
        row.emAberto += 1;
      }
    });

    return [...rows.entries()]
      .map(([sellerKey, row]) => ({
        sellerKey,
        ...row,
        conversao: row.recebidos > 0 ? (row.ganhos / row.recebidos) * 100 : 0,
      }))
      .sort((a, b) => b.conversao - a.conversao || b.ganhos - a.ganhos);
  }, [leadsFiltrados]);

  if (loading) return <div className="loading-wrap">Carregando…</div>;

  return (
    <div>
      <header className="topbar">
        <div>
          <h1 className="page-title">Métricas</h1>
          <p className="page-subtitle">SLA de atendimento e desempenho por vendedor.</p>
        </div>
        <Link to="/leads" className="action-link">
          Ver leads
        </Link>
      </header>

      <section className="panel section-gap">
        <div className="panel-inner">
          <div className="toolbar">
            <select className="select" value={periodo} onChange={(e) => setPeriodo(e.target.value as '7' | '30' | '90' | 'all')}>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="all">Todo o período</option>
            </select>
            <select className="select" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
              <option value="">Todos os vendedores</option>
              {sellerOptions.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
            <button type="button" className="button button--secondary" onClick={() => {
              setPeriodo('30');
              setSellerId('');
            }}>
              Resetar filtros
            </button>
          </div>
          {error && <p className="text-error">{error}</p>}
        </div>
      </section>

      <section className="panel section-gap">
        <div className="panel-inner">
          <div className="metric-grid">
            <div className="metric-card">
              <p className="metric-label">Leads no recorte</p>
              <p className="metric-value">{leadsFiltrados.length}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Tempo até qualificação (média)</p>
              <p className="metric-value">{mediaTempoQualificacao.toFixed(0)} min</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Tempo até 1º contato (média)</p>
              <p className="metric-value">{mediaTempoPrimeiroContato.toFixed(0)} min</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Conversão (vendidos / handoff)</p>
              <p className="metric-value">{conversao.toFixed(1)}%</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Sem contato &gt; 24h</p>
              <p className="metric-value">{semContato24h.length}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Em aberto</p>
              <p className="metric-value">{emAberto.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel section-gap">
        <div className="panel-inner">
          <h2>Desempenho por vendedor</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th className="cell-num">Recebidos</th>
                <th className="cell-num">1º contato no SLA (24h)</th>
                <th className="cell-num">Em aberto</th>
                <th className="cell-num">Ganhos</th>
                <th className="cell-num">Conversão</th>
              </tr>
            </thead>
            <tbody>
              {porVendedor.map((row) => (
                <tr key={row.sellerKey}>
                  <td>{row.sellerName}</td>
                  <td className="cell-num">{row.recebidos}</td>
                  <td className="cell-num">{row.contatoNoSla}</td>
                  <td className="cell-num">{row.emAberto}</td>
                  <td className="cell-num">{row.ganhos}</td>
                  <td className="cell-num">{row.conversao.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {porVendedor.length === 0 && (
            <p className="empty-state">Nenhum vendedor com leads no período selecionado.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-inner">
          <h2>Leads por modelo</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Modelo</th>
                <th className="cell-num">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(porModelo)
                .sort((a, b) => b[1] - a[1])
                .map(([modelo, qtd]) => (
                  <tr key={modelo}>
                    <td>{modelo}</td>
                    <td className="cell-num">{qtd}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {Object.keys(porModelo).length === 0 && (
            <p className="empty-state">Sem dados de modelo para o recorte selecionado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
