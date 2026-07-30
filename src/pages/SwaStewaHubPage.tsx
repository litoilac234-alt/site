import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listReports, type SwaStewaReport } from '../lib/swaStewaApi';
import { canUserCreateReportType, reportIsViewOnly } from '../lib/reportPermissions';
import { ButtonLink } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';

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

export function SwaStewaHubPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SwaStewaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderOpen, setFolderOpen] = useState(false);

  const canCreateIar = canUserCreateReportType(user?.role, 'IAR');

  useEffect(() => {
    setLoading(true);
    listReports({ type: 'IAR' })
      .then((d) => setReports(d.reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const reportLink = (report: SwaStewaReport) => {
    if (
      (report.status === 'generated' || report.status === 'approved') &&
      reportIsViewOnly(user?.role, report.report_type)
    ) {
      return `/reports/view/${encodeURIComponent(report.report_number)}`;
    }
    return `/swa-stewa/edit/${report.id}`;
  };

  const sorted = [...reports].sort(
    (a, b) => reportDateOf(b).getTime() - reportDateOf(a).getTime(),
  );

  return (
    <main className="app-main flex-1 overflow-y-auto">
      <PageHeader
        badge="Reports"
        title="IAR"
        description="Inspection & Acceptance Reports. Open the IAR folder to browse your reports."
        actions={
          canCreateIar && (
            <ButtonLink to="/swa-stewa/new/IAR" variant="primary">
              + New IAR
            </ButtonLink>
          )
        }
      />

      <div className="mx-auto max-w-5xl space-y-4 px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text">Stored Reports</h2>
          {folderOpen && (
            <button
              type="button"
              onClick={() => setFolderOpen(false)}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted"
            >
              ← All folders
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-text-muted">Loading IAR reports…</p>
        ) : !folderOpen ? (
          <div className="max-w-md">
            <button
              type="button"
              onClick={() => setFolderOpen(true)}
              className="w-full rounded-2xl border border-teal-200 bg-teal-50/80 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Folder</p>
                  <p className="mt-1 text-xl font-bold text-text">IAR</p>
                  <p className="mt-1 text-sm text-text-muted">Inspection & Acceptance Report</p>
                </div>
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-sm font-bold text-text"
                  aria-hidden
                >
                  I
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-text">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'}
              </p>
              <p className="mt-1 text-xs font-semibold text-primary">Open folder →</p>
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-6">
            <p className="font-bold text-text">IAR folder</p>
            <p className="mt-2 text-sm text-text-muted">
              {canCreateIar
                ? 'No IAR reports yet. Create one with + New IAR.'
                : 'No IAR reports in this folder yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-teal-200 bg-teal-50/80 px-5 py-3">
              <p className="text-sm font-bold text-text">
                IAR · {sorted.length} {sorted.length === 1 ? 'report' : 'reports'}
              </p>
              <p className="text-xs text-text-muted">Inspection & Acceptance Report</p>
            </div>
            {sorted.map((r) => (
              <Link
                key={r.id}
                to={reportLink(r)}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/30"
              >
                <div>
                  <p className="font-medium text-text">{projectTitleOf(r)}</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-text">{r.report_number}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {reportDateOf(r).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={r.status} />
                  <span className="text-xs font-semibold text-primary">
                    {reportIsViewOnly(user?.role, r.report_type) ||
                    r.status === 'generated' ||
                    r.status === 'approved'
                      ? 'View report →'
                      : 'Open report →'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
