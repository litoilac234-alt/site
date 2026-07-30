import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { ProjectSelect } from '../components/ProjectSelect';
import { getSchedule } from '../lib/scheduleApi';
import { DEPENDENCY_LABELS } from '../lib/pdm';
import { PdmNode } from '../components/PdmNode';
import type { PdmActivity, PdmDependency } from '../types';

const NODE_HALF_W = 60;
const NODE_HALF_H = 45;

function nodePosition(act: PdmActivity, index: number) {
  if (act.posX != null && act.posY != null) {
    return { x: act.posX, y: act.posY };
  }
  return { x: 120 + (index % 3) * 160, y: 90 + Math.floor(index / 3) * 150 };
}

function diagramBounds(positions: Record<string, { x: number; y: number }>) {
  const pad = 56;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  Object.values(positions).forEach((p) => {
    minX = Math.min(minX, p.x - NODE_HALF_W);
    maxX = Math.max(maxX, p.x + NODE_HALF_W);
    minY = Math.min(minY, p.y - NODE_HALF_H);
    maxY = Math.max(maxY, p.y + NODE_HALF_H);
  });
  if (!Number.isFinite(minX)) {
    return { x: 0, y: 0, w: 560, h: 360 };
  }
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
}

function dependencyEdge(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { d: string; x1: number; y1: number; x2: number; y2: number; curved: boolean } {
  const x1 = from.x + NODE_HALF_W;
  const y1 = from.y;
  const x2 = to.x - NODE_HALF_W;
  const y2 = to.y;
  const sameRow = Math.abs(from.y - to.y) < 40;
  if (sameRow) {
    return { d: '', x1, y1, x2, y2, curved: false };
  }
  const midX = (x1 + x2) / 2;
  const bow = from.y < to.y ? 50 : -50;
  const cY = (y1 + y2) / 2 + bow;
  return { d: `M ${x1} ${y1} Q ${midX} ${cY} ${x2} ${y2}`, x1, y1, x2, y2, curved: true };
}

export function PdmPage() {
  const { user } = useAuth();
  const { projectId, setProjectId } = useSelectedProject();
  const [activities, setActivities] = useState<PdmActivity[]>([]);
  const [dependencies, setDependencies] = useState<PdmDependency[]>([]);
  const [projectDuration, setProjectDuration] = useState(0);
  const [criticalPath, setCriticalPath] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getSchedule(Number(projectId));
        if (!cancelled) {
          setActivities(data.activities);
          setDependencies(data.dependencies);
          setProjectDuration(data.projectDuration);
          setCriticalPath(data.criticalPath);
          setError(data.pdmError ?? '');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load PDM schedule from database.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    activities.forEach((a, i) => {
      map[a.id] = nodePosition(a, i);
    });
    return map;
  }, [activities]);

  const criticalNumbers = criticalPath.join(' → ');

  const bounds = useMemo(() => diagramBounds(positions), [positions]);

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            PDM Scheduling
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text">Precedence Diagramming Method</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            Network diagram showing activity sequencing, dependencies (FS, SS, FF, SF), and
            automatically computed critical path — the longest dependent sequence determining
            shortest project completion time.
          </p>
        </div>
        {user?.role === 'contractor' && (
          <div className="flex flex-wrap items-center gap-3">
            <ProjectSelect value={projectId} onChange={setProjectId} className="min-w-[200px]" />
            <Link
              to="/schedule"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Edit schedule
            </Link>
          </div>
        )}
        {user?.role !== 'contractor' && (
          <ProjectSelect value={projectId} onChange={setProjectId} className="min-w-[200px]" />
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-text-muted">Loading schedule…</p>
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase text-text-muted">Project Duration</p>
              <p className="text-2xl font-bold text-text">{projectDuration} days</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase text-text-muted">Critical Activities</p>
              <p className="text-2xl font-bold text-warning">{criticalNumbers || '—'}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase text-text-muted">Dependencies</p>
              <p className="text-sm text-text-muted">
                {[...new Set(dependencies.map((d) => d.type))].join(', ') || '—'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card p-6 shadow-sm">
            <svg
              viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
              className="mx-auto w-full min-h-[280px] max-w-4xl"
              preserveAspectRatio="xMidYMid meet"
            >
              <text x={bounds.x + 16} y={bounds.y + 24} className="fill-text-muted text-[11px]">
                Start
              </text>
              <text x={bounds.x + bounds.w - 48} y={bounds.y + 24} className="fill-text-muted text-[11px]">
                Finish
              </text>

              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#9ca89f" />
                </marker>
                <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#c4a574" />
                </marker>
              </defs>

              {dependencies.map((dep) => {
                const from = positions[dep.fromId];
                const to = positions[dep.toId];
                if (!from || !to) return null;
                const isCritical =
                  activities.find((a) => a.id === dep.fromId)?.isCritical &&
                  activities.find((a) => a.id === dep.toId)?.isCritical;
                const stroke = isCritical ? '#c4a574' : '#9ca89f';
                const edge = dependencyEdge(from, to);
                if (edge.curved) {
                  return (
                    <path
                      key={dep.id}
                      d={edge.d}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={isCritical ? 2.5 : 1.5}
                      markerEnd={isCritical ? 'url(#arrow-critical)' : 'url(#arrow)'}
                    />
                  );
                }
                return (
                  <line
                    key={dep.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={stroke}
                    strokeWidth={isCritical ? 2.5 : 1.5}
                    markerEnd={isCritical ? 'url(#arrow-critical)' : 'url(#arrow)'}
                  />
                );
              })}

              {activities.map((act) => {
                const pos = positions[act.id];
                if (!pos) return null;
                return <PdmNode key={act.id} activity={act} x={pos.x} y={pos.y} />;
              })}
            </svg>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-text">Dependency Types</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                {Object.entries(DEPENDENCY_LABELS).map(([key, label]) => (
                  <li key={key}>
                    <strong className="text-text">{key}</strong> — {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-text">Activity Schedule Table</h3>
              <div className="mt-3 max-h-none overflow-x-auto">
              <table className="data-table w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-text-muted">
                    <th className="py-2">No.</th>
                    <th>Activity</th>
                    <th>D</th>
                    <th>ES</th>
                    <th>EF</th>
                    <th>LS</th>
                    <th>LF</th>
                    <th>Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id} className="border-b border-border/50">
                      <td className="py-2 font-medium">{a.number}</td>
                      <td>{a.name}</td>
                      <td>{a.duration}</td>
                      <td>{a.es}</td>
                      <td>{a.ef}</td>
                      <td>{a.ls}</td>
                      <td>{a.lf}</td>
                      <td>{a.isCritical ? 'Yes' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
