import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { ProjectSelect } from '../components/ProjectSelect';
import { DocumentsBackLink } from '../components/DocumentsBackLink';
import { getSchedule } from '../lib/scheduleApi';
import { DEPENDENCY_LABELS } from '../lib/pdm';
import { PdmNode } from '../components/PdmNode';
import type { PdmActivity, PdmDependency } from '../types';

const NODE_HALF_W = 60;
const NODE_HALF_H = 45;
const COL_W = 200;
const ROW_H = 150;

/** Place activities in columns by network rank (predecessors), like a paper PDM. */
function layoutByNetworkRank(
  activities: PdmActivity[],
  dependencies: PdmDependency[],
): Record<string, { x: number; y: number }> {
  const ids = activities.map((a) => a.id);
  const byId = new Map(activities.map((a) => [a.id, a]));
  const preds = new Map<string, string[]>();
  const succs = new Map<string, string[]>();
  for (const id of ids) {
    preds.set(id, []);
    succs.set(id, []);
  }
  for (const d of dependencies) {
    if (!preds.has(d.toId) || !succs.has(d.fromId)) continue;
    preds.get(d.toId)!.push(d.fromId);
    succs.get(d.fromId)!.push(d.toId);
  }

  const indeg = new Map(ids.map((id) => [id, preds.get(id)!.length]));
  const queue = ids.filter((id) => indeg.get(id) === 0);
  const rank = new Map<string, number>();
  while (queue.length) {
    const id = queue.shift()!;
    const pRanks = preds.get(id)!.map((p) => rank.get(p) ?? 0);
    rank.set(id, pRanks.length ? Math.max(...pRanks) + 1 : 0);
    for (const s of succs.get(id)!) {
      indeg.set(s, (indeg.get(s) ?? 1) - 1);
      if (indeg.get(s) === 0) queue.push(s);
    }
  }
  for (const id of ids) {
    if (!rank.has(id)) rank.set(id, 0);
  }

  const layers = new Map<number, string[]>();
  for (const id of ids) {
    const r = rank.get(id) ?? 0;
    const list = layers.get(r) ?? [];
    list.push(id);
    layers.set(r, list);
  }

  const map: Record<string, { x: number; y: number }> = {};
  const originX = 160;
  const originY = 120;
  const sortedRanks = [...layers.keys()].sort((a, b) => a - b);

  for (const r of sortedRanks) {
    const layer = layers.get(r)!;
    layer.sort((a, b) => {
      const predA = preds.get(a) ?? [];
      const predB = preds.get(b) ?? [];
      const avg = (predsOf: string[]) =>
        predsOf.length
          ? predsOf.reduce((sum, p) => sum + (map[p]?.y ?? originY), 0) / predsOf.length
          : originY;
      const ya = avg(predA);
      const yb = avg(predB);
      if (ya !== yb) return ya - yb;
      const na = byId.get(a);
      const nb = byId.get(b);
      return (na?.number ?? '').localeCompare(nb?.number ?? '', undefined, { numeric: true });
    });
    layer.forEach((id, row) => {
      map[id] = { x: originX + r * COL_W, y: originY + row * ROW_H };
    });
  }
  return map;
}

function diagramBounds(positions: Record<string, { x: number; y: number }>) {
  const pad = 72;
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
): { d: string } {
  const x1 = from.x + NODE_HALF_W;
  const y1 = from.y;
  const x2 = to.x - NODE_HALF_W;
  const y2 = to.y;
  if (Math.abs(y1 - y2) < 8 && x2 > x1) {
    return { d: `M ${x1} ${y1} L ${x2} ${y2}` };
  }
  const stub = 18;
  const midX = x2 > x1 ? Math.min(x1 + stub, (x1 + x2) / 2) : x1 + stub;
  return { d: `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}` };
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

  const positions = useMemo(
    () => layoutByNetworkRank(activities, dependencies),
    [activities, dependencies],
  );

  const startActivities = useMemo(
    () => activities.filter((a) => !dependencies.some((d) => d.toId === a.id)),
    [activities, dependencies],
  );

  const endActivities = useMemo(
    () => activities.filter((a) => !dependencies.some((d) => d.fromId === a.id)),
    [activities, dependencies],
  );

  const criticalNumbers = criticalPath.join(' → ');

  const bounds = useMemo(() => diagramBounds(positions), [positions]);

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <DocumentsBackLink />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            PDM Scheduling
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text">Precedence Diagramming Method</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            Network diagram showing activity sequencing, dependencies (FS, SS, FF, SF), and
            critical path. Critical when <strong>(LF − EF) = 0</strong> and{' '}
            <strong>(LS − ES) = 0</strong> (red). Boxes are laid out left to right in network
            sequence from Start to End, like the paper PDM.
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
              <p className="text-2xl font-bold text-red-600">{criticalNumbers || '—'}</p>
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
              className="min-h-[280px]"
              style={{ width: Math.max(bounds.w, 640), height: Math.max(bounds.h, 280) }}
              preserveAspectRatio="xMinYMin meet"
            >

              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#9ca89f" />
                </marker>
                <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#dc2626" />
                </marker>
              </defs>

              {(() => {
                const group = startActivities;
                const ys = group.map((a) => positions[a.id]?.y).filter((y): y is number => y != null);
                const xs = group.map((a) => positions[a.id]?.x).filter((x): x is number => x != null);
                if (ys.length === 0 || xs.length === 0) return null;
                const x = Math.min(...xs) - NODE_HALF_W - 28;
                const y1 = Math.min(...ys);
                const y2 = Math.max(...ys);
                return (
                  <g key="project-start">
                    <line x1={x} y1={y1} x2={x} y2={y2} stroke="#2c2c2a" strokeWidth={2.5} />
                    {group.map((a) => {
                      const pos = positions[a.id];
                      if (!pos) return null;
                      return (
                        <line
                          key={`branch-${a.id}`}
                          x1={x}
                          y1={pos.y}
                          x2={pos.x - NODE_HALF_W}
                          y2={pos.y}
                          stroke="#2c2c2a"
                          strokeWidth={1.75}
                        />
                      );
                    })}
                    <text
                      x={x}
                      y={y1 - 14}
                      textAnchor="middle"
                      className="fill-text text-[10px] font-semibold"
                    >
                      Start
                    </text>
                  </g>
                );
              })()}

              {(() => {
                const group = endActivities;
                const ys = group.map((a) => positions[a.id]?.y).filter((y): y is number => y != null);
                const xs = group.map((a) => positions[a.id]?.x).filter((x): x is number => x != null);
                if (ys.length === 0 || xs.length === 0) return null;
                const x = Math.max(...xs) + NODE_HALF_W + 28;
                const y1 = Math.min(...ys);
                const y2 = Math.max(...ys);
                return (
                  <g key="project-end">
                    <line x1={x} y1={y1} x2={x} y2={y2} stroke="#2c2c2a" strokeWidth={2.5} />
                    {group.map((a) => {
                      const pos = positions[a.id];
                      if (!pos) return null;
                      return (
                        <line
                          key={`end-branch-${a.id}`}
                          x1={pos.x + NODE_HALF_W}
                          y1={pos.y}
                          x2={x}
                          y2={pos.y}
                          stroke="#2c2c2a"
                          strokeWidth={1.75}
                        />
                      );
                    })}
                    <text
                      x={x}
                      y={y1 - 14}
                      textAnchor="middle"
                      className="fill-text text-[10px] font-semibold"
                    >
                      End
                    </text>
                  </g>
                );
              })()}

              {dependencies.map((dep) => {
                const from = positions[dep.fromId];
                const to = positions[dep.toId];
                if (!from || !to) return null;
                const isCritical =
                  !!activities.find((a) => a.id === dep.fromId)?.isCritical &&
                  !!activities.find((a) => a.id === dep.toId)?.isCritical;
                const stroke = isCritical ? '#dc2626' : '#9ca89f';
                const edge = dependencyEdge(from, to);
                return (
                  <path
                    key={dep.id}
                    d={edge.d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isCritical ? 3 : 1.5}
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
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-6 bg-red-600" />
                Critical path (LF−EF = 0 and LS−ES = 0)
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-6 bg-[#9ca89f]" />
                Non-critical dependency
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-0.5 bg-text" />
                Project Start (no predecessors)
              </span>
            </div>
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
                    <th>LF−EF</th>
                    <th>LS−ES</th>
                    <th>Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => {
                    const floatEf = (a.lf ?? 0) - (a.ef ?? 0);
                    const floatEs = (a.ls ?? 0) - (a.es ?? 0);
                    return (
                    <tr
                      key={a.id}
                      className={`border-b border-border/50 ${a.isCritical ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-2 font-medium">{a.number}</td>
                      <td>{a.name}</td>
                      <td>{a.duration}</td>
                      <td>{a.es == null ? '—' : a.es + 1}</td>
                      <td>{a.ef}</td>
                      <td>{a.ls == null ? '—' : a.ls + 1}</td>
                      <td>{a.lf}</td>
                      <td>{floatEf}</td>
                      <td>{floatEs}</td>
                      <td className={a.isCritical ? 'font-semibold text-red-600' : ''}>
                        {a.isCritical ? 'Yes' : '—'}
                      </td>
                    </tr>
                    );
                  })}
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
