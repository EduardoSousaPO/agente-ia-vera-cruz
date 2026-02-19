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
    supabase
      .from('leads')
      .select('id, created_at, qualified_at, handoff_at, seller_first_action_at, lead_stage, lead_model_interest')
      .then(({ data }) => {
        setLeads((data as Lead[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Carregando…</div>;

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
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <nav style={{ marginBottom: 24 }}>
        <Link to="/leads">Leads</Link> | <Link to="/metricas">Métricas</Link>
      </nav>
      <h1>Métricas</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Tempo até qualificação (média)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>
            {mediaTempoQualificacao.toFixed(0)} min
          </div>
        </div>
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Tempo até 1º contato (média)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>
            {mediaTempoPrimeiroContato.toFixed(0)} min
          </div>
        </div>
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
          <div style={{ fontSize: 14, color: '#666' }}>Conversão (vendidos / handoff)</div>
          <div style={{ fontSize: 24, fontWeight: 'bold' }}>{conversao.toFixed(1)}%</div>
        </div>
      </div>
      <h2>Leads por modelo</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>Modelo</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(porModelo)
            .sort((a, b) => b[1] - a[1])
            .map(([modelo, qtd]) => (
              <tr key={modelo} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{modelo}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{qtd}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
