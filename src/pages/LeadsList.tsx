import { DragEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { STAGE_LABELS, STAGE_ORDER, getNextStages } from '../lib/leadStages';

type Lead = {
  id: string;
  lead_phone: string;
  lead_name: string | null;
  lead_city: string | null;
  lead_stage: string | null;
  lead_model_interest: string | null;
  lead_payment_method: string | null;
  assigned_seller_id: string | null;
  handoff_at: string | null;
  seller_first_action_at: string | null;
  last_contact_at: string | null;
  created_at: string;
  sellers?: { id: string; name: string } | { id: string; name: string }[] | null;
};

type Seller = {
  id: string;
  name: string;
};

const PAGE_SIZE = 60;

function getSellerName(lead: Lead): string {
  if (!lead.sellers) return '—';
  if (Array.isArray(lead.sellers)) return lead.sellers[0]?.name ?? '—';
  return lead.sellers.name ?? '—';
}

function isLeadStalled(lead: Lead): boolean {
  if (!lead.handoff_at || lead.seller_first_action_at) return false;
  const handoffTs = new Date(lead.handoff_at).getTime();
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  return handoffTs <= twentyFourHoursAgo;
}

export default function LeadsList() {
  const { user, isGestor, isVendedor } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [filtroStage, setFiltroStage] = useState<string>('');
  const [filtroSellerId, setFiltroSellerId] = useState<string>('');
  const [filtroModelo, setFiltroModelo] = useState('');
  const [filtroPagamento, setFiltroPagamento] = useState('');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('');
  const [somenteSemContato, setSomenteSemContato] = useState(false);
  const [somenteSemVendedor, setSomenteSemVendedor] = useState(false);
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [
    viewMode,
    filtroStage,
    filtroSellerId,
    filtroModelo,
    filtroPagamento,
    filtroCidade,
    filtroPeriodo,
    somenteSemContato,
    somenteSemVendedor,
    busca,
  ]);

  useEffect(() => {
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    let aborted = false;

    async function fetchLeads() {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session?.access_token) {
        if (!aborted) {
          setLoading(false);
          setError('Sessão expirada. Faça login novamente.');
          setLeads([]);
          setSellers([]);
        }
        return;
      }

      const params = new URLSearchParams({
        mode: viewMode,
        page: String(page),
        page_size: String(PAGE_SIZE),
      });

      if (filtroStage) params.set('stage', filtroStage);
      if (filtroSellerId) params.set('seller_id', filtroSellerId);
      if (filtroModelo.trim()) params.set('model', filtroModelo.trim());
      if (filtroPagamento.trim()) params.set('payment', filtroPagamento.trim());
      if (filtroCidade.trim()) params.set('city', filtroCidade.trim());
      if (filtroPeriodo) params.set('period_days', filtroPeriodo);
      if (somenteSemContato) params.set('only_no_contact', 'true');
      if (somenteSemVendedor) params.set('only_unassigned', 'true');
      if (busca.trim()) params.set('search', busca.trim());

      try {
        const response = await fetch(`/api/leads_list?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || 'Falha ao carregar leads.');
        }

        if (aborted) return;
        const rawLeads = (payload.leads ?? []) as Lead[];
        const nextLeads = somenteSemContato ? rawLeads.filter(isLeadStalled) : rawLeads;
        setLeads(nextLeads);
        setSellers((payload.sellers ?? []) as Seller[]);
        setHasNextPage(Boolean(payload.has_next_page));
      } catch (err) {
        if (aborted) return;
        const message = err instanceof Error ? err.message : 'Falha ao carregar leads.';
        setError(message);
        setLeads([]);
        setSellers([]);
        setHasNextPage(false);
      } finally {
        if (!aborted) {
          setLoading(false);
        }
      }
    }

    fetchLeads();

    return () => {
      aborted = true;
    };
  }, [
    viewMode,
    page,
    filtroStage,
    filtroSellerId,
    filtroModelo,
    filtroPagamento,
    filtroCidade,
    filtroPeriodo,
    somenteSemContato,
    somenteSemVendedor,
    busca,
    user,
  ]);

  async function updateLeadStage(lead: Lead, newStage: string) {
    if (!supabase || updatingLeadId) return;
    const { data: { session } } = await supabase!.auth.getSession();
    if (!session?.access_token) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }

    setUpdatingLeadId(lead.id);
    setError('');

    try {
      const response = await fetch('/api/lead_stage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ lead_id: lead.id, new_stage: newStage }),
      });

      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível mover o lead.');
      }

      const now = new Date().toISOString();
      setLeads((prev) =>
        prev.map((item) => {
          if (item.id !== lead.id) return item;
          return {
            ...item,
            lead_stage: newStage,
            last_contact_at: now,
            seller_first_action_at: item.seller_first_action_at ?? now,
          };
        }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar estágio.';
      setError(message);
    } finally {
      setUpdatingLeadId(null);
    }
  }

  function canMoveLead(lead: Lead, targetStage: string) {
    const current = lead.lead_stage ?? 'new';
    if (current === targetStage) return false;
    return getNextStages(current).includes(targetStage);
  }

  function handleDragStart(event: DragEvent<HTMLElement>, leadId: string) {
    event.dataTransfer.setData('text/plain', leadId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingLeadId(leadId);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, targetStage: string) {
    if (!draggingLeadId) return;
    const draggedLead = leads.find((lead) => lead.id === draggingLeadId);
    if (!draggedLead || !canMoveLead(draggedLead, targetStage)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropStage(targetStage);
  }

  function handleDragLeave() {
    setDropStage(null);
  }

  async function handleDrop(event: DragEvent<HTMLElement>, targetStage: string) {
    event.preventDefault();
    setDropStage(null);

    const leadId = event.dataTransfer.getData('text/plain') || draggingLeadId;
    setDraggingLeadId(null);
    if (!leadId) return;

    const lead = leads.find((item) => item.id === leadId);
    if (!lead || !canMoveLead(lead, targetStage)) return;
    await updateLeadStage(lead, targetStage);
  }

  function resetFilters() {
    setFiltroStage('');
    setFiltroSellerId('');
    setFiltroModelo('');
    setFiltroPagamento('');
    setFiltroCidade('');
    setFiltroPeriodo('');
    setSomenteSemContato(false);
    setSomenteSemVendedor(false);
    setBusca('');
  }

  function applyQuickView(view: 'all' | 'new' | 'stalled' | 'won_month' | 'lost' | 'unassigned') {
    resetFilters();
    switch (view) {
      case 'new':
        setFiltroStage('new');
        break;
      case 'stalled':
        setSomenteSemContato(true);
        break;
      case 'won_month':
        setFiltroStage('won');
        setFiltroPeriodo('30');
        break;
      case 'lost':
        setFiltroStage('lost');
        break;
      case 'unassigned':
        setSomenteSemVendedor(true);
        break;
      default:
        break;
    }
  }

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    STAGE_ORDER.forEach((stage) => {
      grouped[stage] = [];
    });

    leads.forEach((lead) => {
      const stage = lead.lead_stage ?? 'new';
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage].push(lead);
    });
    return grouped;
  }, [leads]);

  const stages = STAGE_ORDER;
  const stageOptions = stages.map((s) => ({ value: s, label: STAGE_LABELS[s] ?? s }));

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
              : 'Lista viva do funil comercial com filtros por vendedor, etapa e SLA.'
            }
          </p>
        </div>
        <div className="topbar-actions">
          {isGestor && (
            <Link to="/metricas" className="action-link">
              Ver métricas
            </Link>
          )}
        </div>
      </header>
      <section className="panel">
        <div className="panel-inner">
          {isGestor && (
            <div className="quick-views">
              <button type="button" className="button button--secondary" onClick={() => applyQuickView('all')}>
                Todos
              </button>
              <button type="button" className="button button--secondary" onClick={() => applyQuickView('new')}>
                Novos
              </button>
              <button type="button" className="button button--secondary" onClick={() => applyQuickView('stalled')}>
                Parados 24h
              </button>
              <button type="button" className="button button--secondary" onClick={() => applyQuickView('won_month')}>
                Ganhos no mês
              </button>
              <button type="button" className="button button--secondary" onClick={() => applyQuickView('lost')}>
                Perdidos
              </button>
              <button type="button" className="button button--secondary" onClick={() => applyQuickView('unassigned')}>
                Sem vendedor
              </button>
            </div>
          )}

          <div className="toolbar">
            <div className="segmented-control">
              <button
                type="button"
                className={`button button--secondary${viewMode === 'list' ? ' is-active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                Lista
              </button>
              <button
                type="button"
                className={`button button--secondary${viewMode === 'kanban' ? ' is-active' : ''}`}
                onClick={() => setViewMode('kanban')}
              >
                Kanban
              </button>
            </div>

            <select className="select" value={filtroStage} onChange={(e) => setFiltroStage(e.target.value)}>
              <option value="">Todos os estágios</option>
              {stageOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {isGestor && (
              <select className="select" value={filtroSellerId} onChange={(e) => setFiltroSellerId(e.target.value)}>
                <option value="">Todos os vendedores</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            )}

            <select className="select" value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}>
              <option value="">Todo período</option>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>

            <input
              className="input input--search"
              type="search"
              placeholder="Buscar nome, telefone, cidade ou modelo"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <input
              className="input"
              type="search"
              placeholder="Filtrar modelo"
              value={filtroModelo}
              onChange={(e) => setFiltroModelo(e.target.value)}
            />
            <input
              className="input"
              type="search"
              placeholder="Filtrar pagamento"
              value={filtroPagamento}
              onChange={(e) => setFiltroPagamento(e.target.value)}
            />
            <input
              className="input"
              type="search"
              placeholder="Filtrar cidade"
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={somenteSemContato}
                onChange={(e) => setSomenteSemContato(e.target.checked)}
              />
              Sem contato &gt; 24h
            </label>

            {isGestor && (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={somenteSemVendedor}
                  onChange={(e) => setSomenteSemVendedor(e.target.checked)}
                />
                Sem vendedor atribuído
              </label>
            )}

            <button type="button" className="button button--secondary" onClick={resetFilters}>
              Limpar filtros
            </button>
          </div>

          {error && <p className="text-error">{error}</p>}

          {loading ? (
            <p className="empty-state">Carregando…</p>
          ) : viewMode === 'list' ? (
            <div>
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
                    <th>Último contato</th>
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
                      <td>{l.lead_stage ? (STAGE_LABELS[l.lead_stage] ?? l.lead_stage) : '—'}</td>
                      <td>{l.lead_model_interest || '—'}</td>
                      <td>{l.lead_payment_method || '—'}</td>
                      {isGestor && <td>{getSellerName(l)}</td>}
                      <td>{l.last_contact_at ? new Date(l.last_contact_at).toLocaleString('pt-BR') : 'Sem contato'}</td>
                      <td>{l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  type="button"
                  className="button button--secondary"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Anterior
                </button>
                <span className="muted">Página {page}</span>
                <button
                  type="button"
                  className="button button--secondary"
                  disabled={!hasNextPage || loading}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          ) : (
            <div className="kanban-board">
              {STAGE_ORDER.map((stage) => {
                const stageLeads = leadsByStage[stage] ?? [];
                return (
                  <section
                    key={stage}
                    className={`kanban-column${dropStage === stage ? ' kanban-column--active' : ''}`}
                    onDragOver={(event) => handleDragOver(event, stage)}
                    onDragLeave={handleDragLeave}
                    onDrop={(event) => handleDrop(event, stage)}
                  >
                    <header className="kanban-column__header">
                      <h3>{STAGE_LABELS[stage] ?? stage}</h3>
                      <span>{stageLeads.length}</span>
                    </header>
                    <div className="kanban-column__body">
                      {stageLeads.length === 0 ? (
                        <p className="kanban-empty">Sem leads nesta fase.</p>
                      ) : (
                        stageLeads.map((lead) => (
                          <article
                            key={lead.id}
                            className={`kanban-card${draggingLeadId === lead.id ? ' kanban-card--dragging' : ''}`}
                            draggable={updatingLeadId === null}
                            onDragStart={(event) => handleDragStart(event, lead.id)}
                            onDragEnd={() => {
                              setDraggingLeadId(null);
                              setDropStage(null);
                            }}
                          >
                            <Link to={`/leads/${lead.id}`} className="kanban-card__title">
                              {lead.lead_name || lead.lead_phone}
                            </Link>
                            <p>{lead.lead_phone}</p>
                            <p>{lead.lead_city || 'Cidade não informada'}</p>
                            <p>{lead.lead_model_interest || 'Modelo não informado'}</p>
                            {isGestor && <p>Vendedor: {getSellerName(lead)}</p>}
                            {updatingLeadId === lead.id && <small className="muted">Atualizando estágio…</small>}
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {!loading && leads.length === 0 && (
            <p className="empty-state">
              {isVendedor ? 'Nenhum lead atribuído a você ainda.' : 'Nenhum lead encontrado com os filtros atuais.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
