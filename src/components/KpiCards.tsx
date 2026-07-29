import type { DashboardKpi } from '../lib/dashboardApi';

type KpiKey = 'visibleProjects' | 'pendingApprovals' | 'delayedProjects' | 'inputWarnings';

interface KpiCardsProps {
  kpis?: {
    visibleProjects: DashboardKpi;
    pendingApprovals: DashboardKpi;
    delayedProjects: DashboardKpi;
    inputWarnings: DashboardKpi;
  };
  loading?: boolean;
  cards?: KpiKey[];
}

const CARD_META: { key: KpiKey; title: string; dot: string }[] = [
  { key: 'visibleProjects', title: 'Visible Projects', dot: 'bg-primary' },
  { key: 'pendingApprovals', title: 'Pending Approvals', dot: 'bg-text-muted/40' },
  { key: 'delayedProjects', title: 'Delayed Projects', dot: 'bg-warning' },
  { key: 'inputWarnings', title: 'Input Warnings', dot: 'bg-warning' },
];

export function KpiCards({ kpis, loading, cards }: KpiCardsProps) {
  const visibleCards = cards
    ? CARD_META.filter((card) => cards.includes(card.key))
    : CARD_META;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {visibleCards.map((card) => {
        const data = kpis?.[card.key];
        return (
          <div
            key={card.key}
            className="relative rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <span className={`absolute right-4 top-4 h-2 w-2 rounded-full ${card.dot}`} />
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-text">
              {loading ? '…' : (data?.value ?? '—')}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {loading ? 'Loading from database…' : (data?.label ?? '')}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function PeriodPill({ period }: { period?: string }) {
  return (
    <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted">
      {period ?? 'Current period'}
    </span>
  );
}
