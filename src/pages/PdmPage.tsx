import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { ProjectSelect } from '../components/ProjectSelect';
import { DocumentsBackLink } from '../components/DocumentsBackLink';
import { getSchedule } from '../lib/scheduleApi';
import { PdmNode, PDM_NODE_H, PDM_NODE_W } from '../components/PdmNode';
import type { PdmActivity, PdmDependency } from '../types';

const NODE_HALF_W = PDM_NODE_W / 2;
const NODE_HALF_H = PDM_NODE_H / 2;

function totalFloatOf(a: PdmActivity): number {
  if (a.ls == null || a.es == null) return 0;
  return Math.max(0, a.ls - a.es);
}

/** Free float for FS links: earliest successor ES − this EF (lag-adjusted). */
function freeFloatOf(a: PdmActivity, activities: PdmActivity[], deps: PdmDependency[]): number {
  const tf = totalFloatOf(a);
  const successors = deps.filter((d) => d.fromId === a.id);
  if (successors.length === 0 || a.ef == null) return tf;

  let minAvail = Infinity;
  for (const dep of successors) {
    const succ = activities.find((x) => x.id === dep.toId);
    if (!succ || succ.es == null) continue;
    const lag = dep.lag ?? 0;
    const type = dep.type ?? 'FS';
    if (type === 'FS') {
      minAvail = Math.min(minAvail, succ.es - lag);
    } else if (type === 'SS') {
      minAvail = Math.min(minAvail, succ.es - lag + (a.es ?? 0) - (a.ef ?? 0));
    } else {
      return tf;
    }
  }
  if (!Number.isFinite(minAvail)) return tf;
  return Math.max(0, minAvail - a.ef);
}

function nodePosition(act: PdmActivity, index: number) {
  if (act.posX != null && act.posY != null) {
    return { x: act.posX, y: act.posY };
  }
  return { x: 140 + (index % 3) * 180, y: 100 + Math.floor(index / 3) * 160 };
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
      <DocumentsBackLink />
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
                  <path d="M0,0 L6,3 L0,6" fill="#5b5b5b" />
                </marker>
                <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#c00000" />
                </marker>
              </defs>

              {dependencies.map((dep) => {
                const from = positions[dep.fromId];
                const to = positions[dep.toId];
                if (!from || !to) return null;
                const isCritical =
                  activities.find((a) => a.id === dep.fromId)?.isCritical &&
                  activities.find((a) => a.id === dep.toId)?.isCritical;
                const stroke = isCritical ? '#c00000' : '#5b5b5b';
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
                return (
                  <PdmNode
                    key={act.id}
                    activity={act}
                    x={pos.x}
                    y={pos.y}
                    freeFloat={freeFloatOf(act, activities, dependencies)}
                    totalFloat={totalFloatOf(act)}
                  />
                );
              })}
            </svg>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-semibold text-text">Node legend (PDM template)</h3>
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                <li>
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#5b9bd5] align-middle" />{' '}
                  <strong className="text-text">FF</strong> — Free float = ES(successor) − EF
                </li>
                <li>
                  <span className="inline-block h-3 w-3 rounded-sm border border-border bg-white align-middle" />{' '}
                  <strong className="text-text">TF</strong> — Total float = LS − ES
                </li>
                <li>
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#ed7d31] align-middle" />{' '}
                  <strong className="text-text">DUR</strong> — Activity duration
                </li>
                <li>
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#70ad47] align-middle" />{' '}
                  <strong className="text-text">Name</strong> — Activity name
                </li>
                <li>
                  <strong className="text-text">ES / EF / LS / LF</strong> — Early &amp; late start/finish
                </li>
                <li>
                  <span className="inline-block h-0.5 w-6 bg-[#c00000] align-middle" />{' '}
                  <strong className="text-text">Red path</strong> — Critical path (TF = 0)
                </li>
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
                    <th>FF</th>
                    <th>TF</th>
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
                      <td>{freeFloatOf(a, activities, dependencies)}</td>
                      <td>{totalFloatOf(a)}</td>
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
