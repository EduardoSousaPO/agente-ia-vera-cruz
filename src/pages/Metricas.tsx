import { useEffect, useState } from 'react';
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
};

export default function Metricas() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase
      .from('leads')
      .select('id, created_at, qualified_at, handoff_at, seller_first_action_at, lead_stage, lead_model_interest')
      .then(({ data }) => {
        setLeads((data as Lead[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading-wrap">Carregando…</div>;

  const comQualificacao = leads.filter((l) => l.qualified_at);
  const comHandoff = leads.filter((l) => l.handoff_at);
  const comPrimeiroContato = leads.filter((l) => l.seller_first_action_at);
  const won = leads.filter((l) => l.lead_stage === 'won');

  const mediaTempoQualificacao =
    comQualificacao.length > 0
      ? comQualificacao.reduce((acc, l) => {
          const created = new Date(l.created_at).getTime();
          const q = new Date(l.qualified_at!).getTime();
          return acc + (q - created) / 1000 / 60; // minutos
        }, 0) / comQualificacao.length
      : 0;

  const mediaTempoPrimeiroContato =
    comPrimeiroContato.length > 0
      ? comPrimeiroContato.reduce((acc, l) => {
          const handoff = l.handoff_at ? new Date(l.handoff_at).getTime() : 0;
          const first = new Date(l.seller_first_action_at!).getTime();
          return acc + (first - handoff) / 1000 / 60;
        }, 0) / comPrimeiroContato.length
      : 0;

  const conversao = comHandoff.length > 0 ? (won.length / comHandoff.length) * 100 : 0;

  const porModelo: Record<string, number> = {};
  leads.forEach((l) => {
    const m = l.lead_model_interest || 'Não informado';
    porModelo[m] = (porModelo[m] ?? 0) + 1;
  });

  return (
    <div>
      <header className="topbar">
        <div>
          <h1 className="page-title">Métricas</h1>
          <p className="page-subtitle">SLA de qualificação, ação comercial e desempenho do funil.</p>
        </div>
        <Link to="/leads" className="action-link">
          Ver leads
        </Link>
      </header>
      <section className="panel section-gap">
        <div className="panel-inner">
      <div className="metric-grid">
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
      </div>
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
        </div>
      </section>
    </div>
  );
}
