/** Mapa valor interno (lead_stage) → rótulo em português para a UI */
export const STAGE_LABELS: Record<string, string> = {
  new: 'Novo',
  qualified: 'Qualificado',
  handoff_sent: 'Repassado',
  in_contact: 'Em contato',
  visit_scheduled: 'Visita agendada',
  proposal_sent: 'Proposta enviada',
  follow_up: 'Em negociação',
  won: 'Venda fechada',
  lost: 'Não fechou',
};

/** Estágios que o vendedor pode definir pelo CRM (valor interno) */
export const VENDOR_STAGES = [
  'in_contact',
  'visit_scheduled',
  'proposal_sent',
  'follow_up',
  'won',
  'lost',
] as const;

/** Dado o estágio atual, quais estágios podem ser escolhidos em seguida (para botões) */
export function getNextStages(current: string | null): string[] {
  switch (current) {
    case 'handoff_sent':
      return ['in_contact', 'lost'];
    case 'in_contact':
    case 'visit_scheduled':
      return ['visit_scheduled', 'proposal_sent', 'follow_up', 'won', 'lost'];
    case 'proposal_sent':
      return ['follow_up', 'won', 'lost'];
    case 'follow_up':
      return ['won', 'lost'];
    case 'won':
    case 'lost':
      return [];
    default:
      return ['in_contact', 'visit_scheduled', 'proposal_sent', 'follow_up', 'won', 'lost'];
  }
}

/** Ordem para filtro/lista (exibição) */
export const STAGE_ORDER = [
  'new',
  'qualified',
  'handoff_sent',
  'in_contact',
  'visit_scheduled',
  'proposal_sent',
  'follow_up',
  'won',
  'lost',
];
