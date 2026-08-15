import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { ProjectSelect } from '../components/ProjectSelect';
import { UndoRedoToolbar } from '../components/ui/UndoRedoToolbar';
import { useUndoRedo, useUndoRedoKeyboard } from '../hooks/useUndoRedo';
import { getSchedule, saveSchedule, type ProjectSchedule } from '../lib/scheduleApi';
import { listProjects } from '../lib/projectsApi';
import { applyPdmDerivatives } from '../lib/scheduleSync';
import { buildRoadPdmSample } from '../data/roadPdmSample';

const DEP_TYPES: DependencyType[] = ['FS', 'SS', 'FF', 'SF'];

function newActivity(i: number): PdmActivity {
  const letter = String.fromCharCode(65 + (i % 26));
  return { id: `new-${Date.now()}-${i}`, number: letter, name: `Activity ${letter}`, duration: 3 };
}

export function ScheduleEditorPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'contractor';

  const { projectId, setProjectId } = useSelectedProject();
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);
  const {
    state: data,
    set: setData,
    replace: replaceData,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<ProjectSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState<'pdm' | 'bar'>('pdm');

  const patchSchedule = useCallback(
    (updater: (schedule: ProjectSchedule) => ProjectSchedule) => {
      setData((d) => (d ? applyPdmDerivatives(updater(d)) : d));
    },
    [setData],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      replaceData(applyPdmDerivatives(await getSchedule(Number(projectId))));
    } catch {
      setError('Could not load schedule from database.');
    } finally {
      setLoading(false);
    }
  }, [projectId, replaceData]);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((res) => {
        if (cancelled) return;
        setHasProjects(res.projects.length > 0);
        if (res.projects.length > 0 && !res.projects.some((p) => String(p.id) === projectId)) {
          setProjectId(String(res.projects[0].id));
        }
      })
      .catch(() => {
        if (!cancelled) setHasProjects(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, setProjectId]);

  useEffect(() => {
    if (hasProjects === false) return;
    load();
  }, [load, hasProjects]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = applyPdmDerivatives(
        await saveSchedule({
          project_id: Number(projectId),
          activities: data.activities,
          dependencies: data.dependencies,
          barChartTasks: data.barChartTasks,
          barChartTimeNow: data.barChartTimeNow,
        }),
      );
      replaceData(saved);
      setSuccess(
        'Schedule saved. PDM, bar chart, and S-curve are synced. Critical path: ' +
          (saved.criticalPath.join(' → ') || '—'),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateActivity = (id: string, patch: Partial<PdmActivity>) => {
    patchSchedule((d) => ({
      ...d,
      activities: d.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  };

  const updateActualEnd = (id: string, actualEndDay: number | undefined) => {
    patchSchedule((d) => ({
      ...d,
      barChartTasks: d.barChartTasks.map((t) => (t.id === id ? { ...t, actualEndDay } : t)),
    }));
  };

  useUndoRedoKeyboard(undo, redo, canEdit && !!data);

  if (!canEdit) {
    return (
      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-text-muted">Only contractors can edit the construction schedule.</p>
        <Link to="/pdm" className="mt-4 inline-block text-primary underline">
          View PDM Schedule
        </Link>
      </main>
    );
  }

  if (hasProjects === false) {
    return (
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h1 className="text-lg font-bold text-amber-900">Waiting for a project</h1>
          <p className="mt-2 text-sm text-amber-800">
            No project has been created yet. Engineer I must create a project and assign a project
            title before the contractor can prepare the construction schedule.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Contractor
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text">Prepare Construction Schedule</h1>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Enter PDM activities and dependencies. Use Early Start (ES) when activities must start
            on the same day and run in parallel. When you save, the system builds the bar chart and
            S-curve from the same schedule.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectSelect value={projectId} onChange={setProjectId} className="min-w-[200px]" />
          <UndoRedoToolbar canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          <button
            type="button"
            disabled={saving || !data}
            onClick={handleSave}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save schedule'}
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {success && <p className="mb-4 text-sm text-primary">{success}</p>}

      {loading || !data ? (
        <p className="text-sm text-text-muted">Loading schedule…</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('pdm')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'pdm' ? 'bg-primary text-white' : 'border border-border'}`}
            >
              PDM Activities
            </button>
            <button
              type="button"
              onClick={() => setTab('bar')}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'bar' ? 'bg-primary text-white' : 'border border-border'}`}
            >
              Bar Chart (auto)
            </button>
            <Link to="/pdm" className="ml-auto self-center text-sm text-primary underline">
              Preview PDM diagram →
            </Link>
            <Link to="/bar-chart" className="self-center text-sm text-primary underline">
              Preview bar chart →
            </Link>
            <Link to="/s-curve" className="self-center text-sm text-primary underline">
              Preview S-curve →
            </Link>
          </div>

          {tab === 'pdm' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-text">Activities</h2>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Use <strong>Early Start (ES)</strong> para magsabay ang activities (parallel).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      patchSchedule((d) => ({
                        ...d,
                        activities: [...d.activities, newActivity(d.activities.length)],
                      }))
                    }
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                  >
                    + Add activity
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Replace the current activities with the road project PDM (billboard, mobilization, PCCP, etc.)?',
                        )
                      ) {
                        return;
                      }
                      const sample = buildRoadPdmSample();
                      patchSchedule((d) => ({
                        ...d,
                        activities: sample.activities,
                        dependencies: sample.dependencies,
                      }));
                    }}
                    className="rounded-lg border border-primary/40 bg-primary-light/50 px-3 py-1.5 text-xs font-medium text-primary"
                  >
                    Load road PDM sample
                  </button>
                  </div>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-text-muted">
                      <th className="py-2 pr-2">No.</th>
                      <th className="py-2 pr-2">Name</th>
                      <th className="py-2 pr-2">Duration</th>
                      <th
                        className="py-2 pr-2 text-primary"
                        title="Optional Early Start day. Leave blank for formula. Set 1 on multiple activities to start them in parallel on Day 1."
                      >
                        Early Start (ES)
                      </th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.activities.map((a) => (
                      <tr key={a.id} className="border-b border-border/50">
                        <td className="py-2 pr-2">
                          <input
                            value={a.number}
                            onChange={(e) => updateActivity(a.id, { number: e.target.value })}
                            className="w-24 rounded border border-border px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            value={a.name}
                            onChange={(e) => updateActivity(a.id, { name: e.target.value })}
                            className="w-full rounded border border-border px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={a.duration}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^\d]/g, '');
                              updateActivity(a.id, {
                                duration: raw === '' ? 0 : Number(raw),
                              });
                            }}
                            className="w-16 rounded border border-border px-2 py-1"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={a.esOverride ?? ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d]/g, '');
                                updateActivity(a.id, {
                                  esOverride: raw === '' ? null : Number(raw),
                                });
                              }}
                              placeholder="auto"
                              title="Early Start day (1 = Day 1). Leave blank to use the normal ES formula."
                              className="w-16 rounded border border-primary/40 bg-primary-light/30 px-2 py-1"
                            />
                            <span className="whitespace-nowrap text-[10px] text-text-muted">
                              → Day {(a.es ?? 0) + 1}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              patchSchedule((d) => ({
                                ...d,
                                activities: d.activities.filter((x) => x.id !== a.id),
                                dependencies: d.dependencies.filter(
                                  (dep) => dep.fromId !== a.id && dep.toId !== a.id,
                                ),
                              }))
                            }
                            className="text-xs text-red-600"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 rounded-lg border border-primary/20 bg-primary-light/40 px-3 py-2 text-xs text-text-muted">
                  <strong className="text-text">Early Start (ES):</strong> blank = normal formula
                  (retain). Para magsabay ang activities (hal. Reinforcing at Buhos), ilagay ang
                  parehong ES — <strong className="text-text">1</strong> = lahat magsisimula sa Day
                  1, parallel sa bar chart.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-text">Dependencies</h2>
                  <button
                    type="button"
                    onClick={() => {
                      const acts = data.activities;
                      if (acts.length < 2) return;
                      patchSchedule((d) => ({
                        ...d,
                        dependencies: [
                          ...d.dependencies,
                          {
                            id: `new-d-${Date.now()}`,
                            fromId: acts[0].id,
                            toId: acts[1].id,
                            type: 'FS',
                          },
                        ],
                      }));
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
                  >
                    + Add dependency
                  </button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase text-text-muted">
                      <th className="py-2">From</th>
                      <th className="py-2">To</th>
                      <th className="py-2">Type</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.dependencies.map((d) => (
                      <tr key={d.id} className="border-b border-border/50">
                        <td className="py-2 pr-2">
                          <select
                            value={d.fromId}
                            onChange={(e) =>
                              patchSchedule((prev) => ({
                                ...prev,
                                dependencies: prev.dependencies.map((x) =>
                                  x.id === d.id ? { ...x, fromId: e.target.value } : x,
                                ),
                              }))
                            }
                            className="rounded border border-border px-2 py-1"
                          >
                            {data.activities.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.number} — {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={d.toId}
                            onChange={(e) =>
                              patchSchedule((prev) => ({
                                ...prev,
                                dependencies: prev.dependencies.map((x) =>
                                  x.id === d.id ? { ...x, toId: e.target.value } : x,
                                ),
                              }))
                            }
                            className="rounded border border-border px-2 py-1"
                          >
                            {data.activities.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.number} — {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={d.type}
                            onChange={(e) =>
                              patchSchedule((prev) => ({
                                ...prev,
                                dependencies: prev.dependencies.map((x) =>
                                  x.id === d.id ? { ...x, type: e.target.value as DependencyType } : x,
                                ),
                              }))
                            }
                            className="rounded border border-border px-2 py-1"
                          >
                            {DEP_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              patchSchedule((prev) => ({
                                ...prev,
                                dependencies: prev.dependencies.filter((x) => x.id !== d.id),
                              }))
                            }
                            className="text-xs text-red-600"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-sm text-text-muted">
                  Critical path: <strong>{data.criticalPath.join(' → ') || '—'}</strong> · Project duration:{' '}
                  <strong>{data.projectDuration} days</strong>
                </p>
              </div>
            </div>
          )}

          {tab === 'bar' && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="mb-4 text-sm text-text-muted">
                Bar chart tasks are generated automatically from PDM (ES/EF). You can record actual end days
                for progress tracking.
              </p>
              <div className="mb-4 flex flex-wrap gap-4">
                <label className="text-sm">
                  Total days (from PDM)
                  <input
                    type="number"
                    readOnly
                    value={data.barChartTotalDays}
                    className="ml-2 w-20 rounded border border-border bg-surface-muted px-2 py-1"
                  />
                </label>
                <label className="text-sm">
                  Time-now (day)
                  <input
                    type="number"
                    min={1}
                    value={data.barChartTimeNow}
                    onChange={(e) =>
                      patchSchedule((d) => ({ ...d, barChartTimeNow: Number(e.target.value) }))
                    }
                    className="ml-2 w-20 rounded border border-border px-2 py-1"
                  />
                </label>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-text-muted">
                    <th className="py-2">#</th>
                    <th className="py-2">Task name</th>
                    <th className="py-2">Start</th>
                    <th className="py-2">End</th>
                    <th className="py-2">Actual end</th>
                  </tr>
                </thead>
                <tbody>
                  {data.barChartTasks.map((t) => (
                    <tr key={t.id} className="border-b border-border/50">
                      <td className="py-2 pr-2">{t.index}</td>
                      <td className="py-2 pr-2">{t.name}</td>
                      <td className="py-2 pr-2">{t.startDay}</td>
                      <td className="py-2 pr-2">{t.endDay}</td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          value={t.actualEndDay ?? ''}
                          onChange={(e) =>
                            updateActualEnd(
                              t.id,
                              e.target.value === '' ? undefined : Number(e.target.value),
                            )
                          }
                          className="w-16 rounded border border-border px-2 py-1"
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
