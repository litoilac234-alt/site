import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listReports, type SwaStewaReport } from '../lib/swaStewaApi';
import {
  canUserCreateReportType,
  canUserEditReportType,
  reportIsViewOnly,
  type SwaStewaReportKind,
} from '../lib/reportPermissions';

const REPORT_TYPES: { type: SwaStewaReportKind; label: string; desc: string; color: string }[] = [
  { type: 'IAR', label: 'IAR', desc: 'Inspection & Acceptance Report', color: 'border-teal-200 bg-teal-50/80' },
  { type: 'SWA', label: 'SWA', desc: 'Summary of Work Accomplished', color: 'border-violet-200 bg-violet-50/80' },
  { type: 'STEWA', label: 'STEWA', desc: 'Statement of Time Elapsed & Work Accomplished', color: 'border-amber-200 bg-amber-50/80' },
];

const SCHEDULE_DOC_LINKS = [
  { to: '/pdm', label: 'PDM Schedule', desc: 'Precedence diagram and critical path', icon: '◇' },
  { to: '/bar-chart', label: 'Bar Chart', desc: 'Target plan vs actual progress bars', icon: '▬' },
  { to: '/s-curve', label: 'S-Curve', desc: 'Cumulative progress over time', icon: '⌇' },
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending',
  with_engineer_3: 'Pending',
  with_engineer_4: 'Pending',
  approved: 'Approved',
  rejected: 'Revision Requested',
  generated: 'Finalized',
};

const isReviewerRole = (role: string | undefined) =>
  role === 'engineer_2' || role === 'engineer_3' || role === 'engineer_4';

export function ReportsPage() {
  const { user } = useAuth();
  const canManageTemplates = user?.role === 'engineer_4';
  const isContractor = user?.role === 'contractor';
  const isReviewer = isReviewerRole(user?.role);
  const creatableTypes = REPORT_TYPES.filter((rt) => canUserCreateReportType(user?.role, rt.type));
  const canSubmit = creatableTypes.length > 0 && !isReviewer;

  const [reports, setReports] = useState<SwaStewaReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFolder, setOpenFolder] = useState<SwaStewaReportKind | null>(null);

  useEffect(() => {
    listReports()
      .then((res) => setReports(res.reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const isApprovedReport = (status: string) =>
    status === 'approved' || status === 'generated';

  // Folders only list approved / finalized reports (not drafts or pending).
  const visible = reports.filter((r) => isApprovedReport(r.status));

  const folders = REPORT_TYPES.map((rt) => ({
    ...rt,
    items: visible.filter((r) => r.report_type === rt.type),
  }));

  const openFolderMeta = folders.find((f) => f.type === openFolder) ?? null;

  const canEditReport = (rpt: SwaStewaReport) =>
    (rpt.status === 'draft' || rpt.status === 'rejected') &&
    canUserEditReportType(user?.role, rpt.report_type);

  const reportTitle = (r: SwaStewaReport) =>
    (r.report_data?.project_name as string) || r.project_name || `Project #${r.project_id}`;

  const documentLinks = SCHEDULE_DOC_LINKS;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            {isReviewer ? 'Documents' : 'Reports'}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text">
            {isReviewer
              ? 'Documents'
              : isContractor
                ? 'Progress Reports'
                : 'Report Generation'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            {isReviewer
              ? 'Only reports finalized by Engineer IV appear here. Approvals and revision requests stay in For Approval until finalization.'
              : isContractor
                ? 'Prepare and edit IAR reports. SWA and STEWA reports from Engineer I are view only.'
                : 'SWA, STEWA, and IAR reports are stored in the database with PDF and QR verification.'}
          </p>
        </div>
        <div className="flex gap-2">
          {canManageTemplates && (
            <Link
              to="/reports/templates"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
            >
              Manage templates
            </Link>
          )}
          {!isReviewer && (
            <Link
              to="/swa-stewa"
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-muted"
            >
              IAR folders
            </Link>
          )}
        </div>
      </div>

      {isReviewer && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Browse documents
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documentLinks.map((doc) =>
              doc.to.startsWith('#') ? (
                <a
                  key={doc.label}
                  href={doc.to}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-xs font-bold text-primary">
                    {doc.icon}
                  </span>
                  <p className="mt-3 font-bold text-text">{doc.label}</p>
                  <p className="mt-1 text-sm text-text-muted">{doc.desc}</p>
                  <p className="mt-4 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                    Open →
                  </p>
                </a>
              ) : (
                <Link
                  key={doc.label}
                  to={doc.to}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-xs font-bold text-primary">
                    {doc.icon}
                  </span>
                  <p className="mt-3 font-bold text-text">{doc.label}</p>
                  <p className="mt-1 text-sm text-text-muted">{doc.desc}</p>
                  <p className="mt-4 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                    Open →
                  </p>
                </Link>
              ),
            )}
          </div>
        </div>
      )}

      {canSubmit && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Create a report
          </h2>
          <div className={`grid gap-4 ${creatableTypes.length === 1 ? 'max-w-md' : 'sm:grid-cols-3'}`}>
            {creatableTypes.map((rt) => (
              <Link
                key={rt.type}
                to={`/swa-stewa/new/${rt.type}`}
                className={`group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${rt.color}`}
              >
                <p className="font-bold text-text">{rt.label}</p>
                <p className="mt-1 text-sm text-text-muted">{rt.desc}</p>
                <p className="mt-4 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
                  Create →
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div id="stored-reports" className="mb-4 scroll-mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-text">
          {isReviewer ? 'Stored reports' : 'Stored Reports'}
        </h2>
        {openFolderMeta && (
          <button
            type="button"
            onClick={() => setOpenFolder(null)}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-muted"
          >
            ← All folders
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading reports from database…</p>
      ) : !openFolderMeta ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {folders.map((folder) => (
            <button
              key={folder.type}
              type="button"
              onClick={() => setOpenFolder(folder.type)}
              className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${folder.color}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Folder</p>
                  <p className="mt-1 text-xl font-bold text-text">{folder.label}</p>
                  <p className="mt-1 text-sm text-text-muted">{folder.desc}</p>
                </div>
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-sm font-bold text-text"
                  aria-hidden
                >
                  {folder.label.slice(0, 1)}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-text">
                {folder.items.length} {folder.items.length === 1 ? 'report' : 'reports'}
              </p>
              <p className="mt-1 text-xs font-semibold text-primary">Open folder →</p>
            </button>
          ))}
        </div>
      ) : openFolderMeta.items.length === 0 ? (
        <div className={`rounded-2xl border p-6 ${openFolderMeta.color}`}>
          <p className="font-bold text-text">{openFolderMeta.label} folder</p>
          <p className="mt-2 text-sm text-text-muted">
            No approved {openFolderMeta.label} reports in this folder yet. Drafts and
            pending reports stay in the workflow until they are approved.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`rounded-2xl border px-5 py-3 ${openFolderMeta.color}`}>
            <p className="text-sm font-bold text-text">
              {openFolderMeta.label} · {openFolderMeta.items.length}{' '}
              {openFolderMeta.items.length === 1 ? 'report' : 'reports'}
            </p>
            <p className="text-xs text-text-muted">{openFolderMeta.desc}</p>
          </div>
          {openFolderMeta.items.map((rpt) => (
            <div
              key={rpt.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div>
                <p className="font-medium text-text">{reportTitle(rpt)}</p>
                <p className="text-sm text-text-muted">{rpt.report_type}</p>
                <p className="mt-1 font-mono text-xs text-text-muted">{rpt.report_number}</p>
                {rpt.rejection_reason && (
                  <p className="mt-2 text-sm text-warning">Revision note: {rpt.rejection_reason}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    rpt.status === 'generated' || rpt.status === 'approved'
                      ? 'bg-primary-light text-primary'
                      : rpt.status === 'rejected'
                        ? 'bg-warning-bg text-warning'
                        : 'bg-surface-muted text-text-muted'
                  }`}
                >
                  {STATUS_LABELS[rpt.status] ?? rpt.status}
                </span>
                {canEditReport(rpt) && (
                  <Link
                    to={`/swa-stewa/edit/${rpt.id}`}
                    className="text-xs font-semibold text-primary underline"
                  >
                    Edit report
                  </Link>
                )}
                {(reportIsViewOnly(user?.role, rpt.report_type) || isReviewer) && (
                  <Link
                    to={
                      rpt.status === 'generated' || rpt.status === 'approved'
                        ? `/reports/view/${encodeURIComponent(rpt.report_number)}`
                        : `/swa-stewa/edit/${rpt.id}`
                    }
                    className="text-xs font-semibold text-primary underline"
                  >
                    View report
                  </Link>
                )}
                {(rpt.status === 'generated' || rpt.status === 'approved' || rpt.public_url) && (
                  <Link
                    to={`/reports/view/${encodeURIComponent(rpt.report_number)}`}
                    className="text-xs text-primary underline"
                  >
                    View PDF / QR
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
