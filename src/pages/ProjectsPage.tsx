import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { createProject, listProjects, type ProjectRow } from '../lib/projectsApi';

export function ProjectsPage() {
  const { user } = useAuth();
  const { setProjectId } = useSelectedProject();
  const canManage = user?.role === 'engineer_1';

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProjects();
      setProjects(res.projects);
    } catch {
      setError('Could not load projects from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) {
      setError('Project title is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await createProject({
        name: name.trim(),
        location: location.trim() || undefined,
        start_date: startDate || undefined,
        planned_end_date: plannedEnd || undefined,
      });
      setSuccess(`Project "${res.project.name}" created. The contractor can now prepare its schedule.`);
      setName('');
      setLocation('');
      setStartDate('');
      setPlannedEnd('');
      setProjectId(String(res.project.id));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.');
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
          Create a new project and assign a project title. This project becomes the basis for the
          schedule the contractor prepares. The contractor cannot start scheduling until a project
          has been created here.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && (
        <div className="mb-4 rounded-xl bg-primary-light p-4 text-sm text-primary">{success}</div>
      )}

      {canManage && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <h2 className="font-semibold text-text">Create new project</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Project title <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Provincial Capitol Annex"
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
                placeholder="e.g. Tuguegarao City"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                Start date
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
          </div>
          <div className="mt-5">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </div>
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-text">{p.name}</p>
                <p className="text-sm text-text-muted">{p.location || 'No location set'}</p>
              </div>
              <span className="rounded-full bg-surface-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
