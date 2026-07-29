import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listReports, type SwaStewaReport } from '../lib/swaStewaApi';
import { canUserCreateReportType, reportIsViewOnly } from '../lib/reportPermissions';
import { ButtonLink } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { ReportTypeBadge, StatusBadge } from '../components/ui/StatusBadge';

interface MonthGroup {
  key: string;
  label: string;
  reports: SwaStewaReport[];
}

interface ProjectGroup {
  key: string;
  title: string;
  months: MonthGroup[];
  count: number;
}

function projectTitleOf(r: SwaStewaReport): string {
  return (
    (r.report_data?.project_title as string) ||
    (r.report_data?.project_name as string) ||
    r.project_name ||
    `Project #${r.project_id}`
  );
}

function reportDateOf(r: SwaStewaReport): Date {
  const raw = (r.report_data?.report_date as string) || r.created_at;
  return new Date(raw);
}

function groupReports(reports: SwaStewaReport[]): ProjectGroup[] {
  const projects = new Map<string, Map<string, SwaStewaReport[]>>();

  for (const r of reports) {
    const projKey = projectTitleOf(r);
    const d = reportDateOf(r);
    const monthKey = Number.isNaN(d.getTime())
      ? 'undated'
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!projects.has(projKey)) projects.set(projKey, new Map());
    const months = projects.get(projKey)!;
    if (!months.has(monthKey)) months.set(monthKey, []);
    months.get(monthKey)!.push(r);
  }

  const monthLabel = (key: string): string => {
    if (key === 'undated') return 'Undated';
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  return Array.from(projects.entries())
    .map(([title, months]) => {
      const monthGroups: MonthGroup[] = Array.from(months.entries())
        .map(([key, reps]) => ({
          key,
          label: `IAR ${monthLabel(key)}`,
          reports: reps.sort((a, b) => reportDateOf(b).getTime() - reportDateOf(a).getTime()),
        }))
        .sort((a, b) => (a.key < b.key ? 1 : -1));
      const count = monthGroups.reduce((sum, mg) => sum + mg.reports.length, 0);
      return { key: title, title, months: monthGroups, count };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function SwaStewaHubPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SwaStewaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const canCreateIar = canUserCreateReportType(user?.role, 'IAR');

  useEffect(() => {
    setLoading(true);
    listReports({ type: 'IAR' })
      .then((d) => setReports(d.reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => groupReports(reports), [reports]);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const reportLink = (report: SwaStewaReport) => {
    if (
      (report.status === 'generated' || report.status === 'approved') &&
      reportIsViewOnly(user?.role, report.report_type)
    ) {
      return `/reports/view/${encodeURIComponent(report.report_number)}`;
    }
    return `/swa-stewa/edit/${report.id}`;
  };

  return (
    <main className="app-main flex-1 overflow-y-auto">
      <PageHeader
        badge="Reports"
        title="IAR"
        description="Inspection & Acceptance Reports organized by project and month. Open a project folder, then a month to see its weekly IAR entries."
        actions={
          canCreateIar && (
            <ButtonLink to="/swa-stewa/new/IAR" variant="primary">
              + New IAR
            </ButtonLink>
          )
        }
      />

      <div className="mx-auto max-w-5xl space-y-4 px-8 py-8">
        {loading ? (
          <p className="text-sm text-text-muted">Loading IAR reports…</p>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <p className="text-sm font-medium text-text-muted">No IAR reports yet</p>
            <p className="mt-1 text-xs text-text-muted">
              {canCreateIar
                ? 'Create an IAR report to get started. It will appear inside its project folder, filed by month.'
                : 'IAR reports will appear here once they are prepared.'}
            </p>
          </div>
        ) : (
          groups.map((project) => {
            const projectCollapsed = collapsed.has(project.key);
            return (
              <div
                key={project.key}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(project.key)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-surface-muted/50"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-lg">{projectCollapsed ? '📁' : '📂'}</span>
                    <span className="font-semibold text-text">{project.title}</span>
                  </span>
                  <span className="flex items-center gap-3 text-xs text-text-muted">
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 font-semibold">
                      {project.count} report{project.count === 1 ? '' : 's'}
                    </span>
                    <span>{projectCollapsed ? '▸' : '▾'}</span>
                  </span>
                </button>

                {!projectCollapsed && (
                  <div className="space-y-2 border-t border-border bg-surface/40 px-4 py-3">
                    {project.months.map((month) => {
                      const monthId = `${project.key}::${month.key}`;
                      const monthCollapsed = collapsed.has(monthId);
                      return (
                        <div key={monthId} className="rounded-xl border border-border/70 bg-card">
                          <button
                            type="button"
                            onClick={() => toggle(monthId)}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-surface-muted/50"
                          >
                            <span className="flex items-center gap-2.5">
                              <span>{monthCollapsed ? '🗂' : '🗂'}</span>
                              <span className="text-sm font-medium text-text">{month.label}</span>
                            </span>
                            <span className="flex items-center gap-3 text-xs text-text-muted">
                              <span>
                                {month.reports.length} report{month.reports.length === 1 ? '' : 's'}
                              </span>
                              <span>{monthCollapsed ? '▸' : '▾'}</span>
                            </span>
                          </button>

                          {!monthCollapsed && (
                            <ul className="divide-y divide-border/60 border-t border-border/60">
                              {month.reports.map((r) => (
                                <li key={r.id}>
                                  <Link
                                    to={reportLink(r)}
                                    className="group flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-surface-muted/50"
                                  >
                                    <span className="flex min-w-0 items-center gap-3">
                                      <ReportTypeBadge type={r.report_type} />
                                      <span className="min-w-0">
                                        <span className="block truncate font-mono text-sm font-semibold text-text group-hover:text-primary">
                                          {r.report_number}
                                        </span>
                                        <span className="block text-xs text-text-muted">
                                          {reportDateOf(r).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                          })}
                                        </span>
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-3">
                                      {reportIsViewOnly(user?.role, r.report_type) && (
                                        <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                                          View only
                                        </span>
                                      )}
                                      <StatusBadge status={r.status} />
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
