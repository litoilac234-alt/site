import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ProjectSelect } from '../components/ProjectSelect';
import { DocumentsBackLink } from '../components/DocumentsBackLink';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { getSCurve, type SCurveActivity } from '../lib/sCurveApi';
import type { SCurvePoint } from '../types';

export function SCurvePage() {
  const { projectId, setProjectId } = useSelectedProject();
  const [points, setPoints] = useState<SCurvePoint[]>([]);
  const [activities, setActivities] = useState<SCurveActivity[]>([]);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [syncedFromPdm, setSyncedFromPdm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSCurve(Number(projectId))
      .then((res) => {
        setPoints(res.points);
        setActivities(res.activities);
        setCriticalPath(res.critical_path);
        setSyncedFromPdm(res.synced_from_pdm);
      })
      .catch(() => {
        setPoints([]);
        setActivities([]);
        setCriticalPath([]);
        setSyncedFromPdm(false);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <DocumentsBackLink />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            S-Curve Analysis
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text">Progress S-Curve Analysis</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            Planned progress is built from each PDM activity finish date. Actual progress updates
            automatically from the weekly STEWA and IAR entries — no manual input needed.
          </p>
        </div>
        <ProjectSelect value={projectId} onChange={setProjectId} className="min-w-[200px]" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-center text-lg font-bold uppercase tracking-wide text-text">
          S-Curve Analysis — Progress
        </h3>

        {loading ? (
          <p className="mt-8 text-center text-sm text-text-muted">Loading S-curve data…</p>
        ) : points.length === 0 ? (
          <p className="mt-8 text-center text-sm text-text-muted">No S-curve points recorded yet.</p>
        ) : (
          <>
            <div className="mt-4 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e0dfd8" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#000000', fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                    tick={{ fill: '#000000', fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(v) => (v != null ? `${v}%` : '—')}
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as SCurvePoint | undefined;
                      if (row?.label) return `${row.date} · ${row.label}`;
                      return row?.date ?? '';
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="originalPlan"
                    name="Target Plan %"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#2563eb' }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    name="Actual %"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f97316' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-center text-xs">
                <thead>
                  <tr className="border-b-2 border-text bg-surface-muted">
                    <th className="p-2 text-left font-bold">Date</th>
                    {points.map((p) => (
                      <th key={p.date} className="border-l border-border p-2 font-normal">
                        {p.date}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-2 text-left font-semibold text-[#2563eb]">Target Plan %</td>
                    {points.map((p) => (
                      <td key={p.date} className="border-l border-border p-2">
                        {p.originalPlan != null ? `${p.originalPlan}%` : ''}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 text-left font-semibold text-[#f97316]">Actual %</td>
                    {points.map((p) => (
                      <td key={p.date} className="border-l border-border p-2">
                        {p.actual != null ? `${p.actual}%` : ''}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-text-muted">
          When slippage is detected, comparing Actual against the Target Plan S-curve supports
          recovery scheduling and cost monitoring.
          {syncedFromPdm && criticalPath.length > 0 && (
            <> Critical path: <strong>{criticalPath.join(' → ')}</strong>.</>
          )}
        </p>
      </div>

      {activities.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-text">PDM activities on this S-curve</h3>
          <p className="mt-1 text-sm text-text-muted">
            Each row is one PDM activity. Planned % is cumulative when that activity finishes.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-text-muted">
                  <th className="py-2 pr-3">No.</th>
                  <th className="py-2 pr-3">Activity</th>
                  <th className="py-2 pr-3">Duration</th>
                  <th className="py-2 pr-3">ES</th>
                  <th className="py-2 pr-3">EF</th>
                  <th className="py-2 pr-3">Finish date</th>
                  <th className="py-2 pr-3">Planned %</th>
                  <th className="py-2">Critical</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={`${a.number}-${a.name}`} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium">{a.number}</td>
                    <td className="py-2 pr-3">{a.name}</td>
                    <td className="py-2 pr-3">{a.duration}d</td>
                    <td className="py-2 pr-3">{a.es}</td>
                    <td className="py-2 pr-3">{a.ef}</td>
                    <td className="py-2 pr-3">{a.finish_date}</td>
                    <td className="py-2 pr-3 font-medium text-primary">{a.planned_pct}%</td>
                    <td className="py-2">{a.is_critical ? 'Yes' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
