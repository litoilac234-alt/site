import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import {
  createProject,
  getProject,
  listContractors,
  listProjects,
  updateProject,
  type ContractorOption,
  type ProjectAuditEntry,
  type ProjectRow,
  type ContractHistoryEntry,
} from '../lib/projectsApi';

function dateInputValue(value: string | null | undefined): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function formatMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ProjectsPage() {
  const { user } = useAuth();
  const { setProjectId } = useSelectedProject();
  const canManage = user?.role === 'engineer_1';

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [contractors, setContractors] = useState<ContractorOption[]>([]);
  const [auditLog, setAuditLog] = useState<ProjectAuditEntry[]>([]);
  const [contractHistory, setContractHistory] = useState<ContractHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [status, setStatus] = useState('active');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setLocation('');
    setStartDate('');
    setPlannedEnd('');
    setContractorId('');
    setContractAmount('');
    setStatus('active');
    setAuditLog([]);
    setContractHistory([]);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, contractorRes] = await Promise.all([listProjects(), listContractors()]);
      setProjects(projRes.projects);
      setContractors(contractorRes.contractors);
    } catch {
      setError('Could not load projects from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startRevise = async (p: ProjectRow) => {
    setError('');
    setSuccess('');
    setEditingId(p.id);
    setName(p.name);
    setLocation(p.location ?? '');
    setStartDate(dateInputValue(p.start_date));
    setPlannedEnd(dateInputValue(p.planned_end_date));
    setContractorId(p.contractor_id != null ? String(p.contractor_id) : '');
    setContractAmount(p.contract_amount != null ? String(p.contract_amount) : '');
    setStatus(p.status || 'active');
    try {
      const detail = await getProject(p.id);
      setAuditLog(detail.audit_log);
      setContractHistory(detail.contract_history);
    } catch {
      setAuditLog([]);
      setContractHistory([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Project title is required.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        location: location.trim() || undefined,
        start_date: startDate || undefined,
        planned_end_date: plannedEnd || undefined,
        status: status || 'active',
        contractor_id: contractorId ? Number(contractorId) : null,
        contract_amount: contractAmount ? parseFloat(contractAmount) : null,
      };

      if (editingId !== null) {
        const res = await updateProject(editingId, input);
        setSuccess(`Project "${res.project.name}" updated.`);
        setProjectId(String(res.project.id));
        const detail = await getProject(editingId);
        setAuditLog(detail.audit_log);
        setContractHistory(detail.contract_history);
      } else {
        const res = await createProject(input);
        setSuccess(
          `Project "${res.project.name}" created. The contractor can now prepare its schedule.`,
        );
        setProjectId(String(res.project.id));
        resetForm();
      }
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : editingId !== null
            ? 'Could not update project.'
            : 'Could not create project.',
      );
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'mt-1.5 w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-text shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="mb-6">
        <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
          Engineer I
        </span>
        <h1 className="mt-3 text-2xl font-bold text-text">Projects</h1>
        <p className="mt-2 max-w-3xl text-sm text-text-muted">
          Record contractor, start date, and contract amount for each project. Changes are logged
          with date and time. SWA/STEWA auto-fill from the latest project information.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && (
        <div className="mb-4 rounded-xl bg-primary-light p-4 text-sm text-primary">{success}</div>
      )}

      {canManage && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-text">
              {editingId !== null ? 'Revise project' : 'Create new project'}
            </h2>
            {editingId !== null && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setSuccess('');
                  setError('');
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-muted"
              >
                Cancel revise
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Project title <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Concreting of Barangay Road"
                className={inputCls}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remebella, Buguey, Cagayan"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Contractor
              </label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Select contractor —</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Contract amount (₱)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                placeholder="5991119.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Project start date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Planned end date
              </label>
              <input
                type="date"
                value={plannedEnd}
                onChange={(e) => setPlannedEnd(e.target.value)}
                className={inputCls}
              />
            </div>
            {editingId !== null && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={inputCls}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On hold</option>
                </select>
              </div>
            )}
          </div>
          <div className="mt-5">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving
                ? editingId !== null
                  ? 'Saving…'
                  : 'Creating…'
                : editingId !== null
                  ? 'Save changes'
                  : 'Create project'}
            </button>
          </div>

          {editingId !== null && contractHistory.length > 0 && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-text">Contract amount history (VO)</h3>
              <p className="mt-1 text-xs text-text-muted">
                Previous approved amounts are kept. New SWA/STEWA use the latest amount.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {contractHistory.map((h) => (
                  <li key={h.id} className="rounded-lg bg-surface-muted px-3 py-2">
                    <span className="font-medium">₱{formatMoney(h.contract_amount)}</span>
                    <span className="text-text-muted"> · effective {h.effective_date}</span>
                    {h.notes && <span className="text-text-muted"> · {h.notes}</span>}
                    <span className="block text-xs text-text-muted">
                      Recorded {formatWhen(h.created_at)}
                      {h.created_by_name ? ` by ${h.created_by_name}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {editingId !== null && auditLog.length > 0 && (
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-text">Change history</h3>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
                {auditLog.map((a) => (
                  <li key={a.id} className="rounded-lg border border-border px-3 py-2">
                    <span className="font-medium">{a.field_name}</span>
                    <span className="text-text-muted">
                      {' '}
                      · {formatWhen(a.created_at)}
                      {a.actor_name ? ` · ${a.actor_name}` : ''}
                    </span>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {a.old_value || '—'} → {a.new_value || '—'}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      )}

      <h2 className="mb-4 text-lg font-semibold text-text">
        All projects ({loading ? '…' : projects.length})
      </h2>
      {loading ? (
        <p className="text-sm text-text-muted">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-text-muted">No projects yet.</p>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm ${
                editingId === p.id ? 'border-primary ring-2 ring-primary/15' : 'border-border'
              }`}
            >
              <div>
                <p className="font-medium text-text">{p.name}</p>
                <p className="text-sm text-text-muted">{p.location || 'No location set'}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {p.contractor_name ? `Contractor: ${p.contractor_name}` : 'No contractor assigned'}
                  {p.contract_amount != null && ` · ₱${formatMoney(p.contract_amount)}`}
                </p>
                {(p.start_date || p.planned_end_date) && (
                  <p className="mt-0.5 text-xs text-text-muted">
                    Start {dateInputValue(p.start_date) || '—'} → End{' '}
                    {dateInputValue(p.planned_end_date) || '—'}
                  </p>
                )}
                {p.updated_at && (
                  <p className="mt-0.5 text-[10px] text-text-muted">
                    Last updated {formatWhen(p.updated_at)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {p.status}
                </span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => startRevise(p)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-light"
                  >
                    Revise
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
