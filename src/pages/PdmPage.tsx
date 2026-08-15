import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSelectedProject } from '../context/SelectedProjectContext';
import { ProjectSelect } from '../components/ProjectSelect';
import { DocumentsBackLink } from '../components/DocumentsBackLink';
import { getSchedule } from '../lib/scheduleApi';
import { DEPENDENCY_LABELS } from '../lib/pdm';
import { MilestoneNode, PDM_NODE_H, PDM_NODE_W, PdmNode, pdmCalendarDays } from '../components/PdmNode';
import type { PdmActivity, PdmDependency } from '../types';

const NODE_HALF_W = PDM_NODE_W / 2;
const NODE_HALF_H = PDM_NODE_H / 2;
const COL_GAP = 210;
const ROW_GAP = 110;

function isSpanningActivity(a: PdmActivity, projectDuration: number): boolean {
  const dur = a.duration ?? 0;
  return (a.es ?? 0) === 0 && projectDuration > 0 && dur >= Math.max(20, projectDuration * 0.5);
}

/**
 * Sample PERT/CPM layout: START on the left, same-start activities stacked
 * (parallel), left→right by start day, long-running work on the top lane, END on the right.
 */
function layoutLikeSample(
  activities: PdmActivity[],
  projectDuration: number,
): Record<string, { x: number; y: number }> {
  const spanning = activities.filter((a) => isSpanningActivity(a, projectDuration));
  const rest = activities.filter((a) => !isSpanningActivity(a, projectDuration));

  const groups = new Map<number, PdmActivity[]>();
  for (const a of rest) {
    const startDay = pdmCalendarDays(a).startDay;
    const list = groups.get(startDay) ?? [];
    list.push(a);
    groups.set(startDay, list);
  }

  const map: Record<string, { x: number; y: number }> = {};
  const sortedStarts = [...groups.keys()].sort((a, b) => a - b);
  const colCount = Math.max(1, sortedStarts.length);

  spanning.forEach((a, i) => {
    map[a.id] = {
      x: 140 + Math.max(0, colCount - 1) * COL_GAP,
      y: 70 + i * ROW_GAP,
    };
  });

  const bodyTop = spanning.length > 0 ? 70 + spanning.length * ROW_GAP + 20 : 120;

  sortedStarts.forEach((startDay, col) => {
    const group = (groups.get(startDay) ?? []).sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true }),
    );
    group.forEach((a, row) => {
      map[a.id] = {
        x: 140 + col * COL_GAP,
        y: bodyTop + row * ROW_GAP,
      };
    });
  });

  return map;
}

function diagramBounds(
  positions: Record<string, { x: number; y: number }>,
  startPos: { x: number; y: number } | null,
  endPos: { x: number; y: number } | null,
) {
  const pad = 72;
  const pts = [
    ...Object.values(positions),
    ...(startPos ? [startPos] : []),
    ...(endPos ? [endPos] : []),
  ];
  if (pts.length === 0) {
    return { x: 0, y: 0, w: 560, h: 360 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  pts.forEach((p) => {
    minX = Math.min(minX, p.x - NODE_HALF_W);
    maxX = Math.max(maxX, p.x + NODE_HALF_W);
    minY = Math.min(minY, p.y - NODE_HALF_H);
    maxY = Math.max(maxY, p.y + NODE_HALF_H);
  });
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

  const positions = useMemo(
    () => layoutLikeSample(activities, projectDuration),
    [activities, projectDuration],
  );

  const predIds = useMemo(() => new Set(dependencies.map((d) => d.toId)), [dependencies]);
  const succIds = useMemo(() => new Set(dependencies.map((d) => d.fromId)), [dependencies]);

  const roots = useMemo(
    () => activities.filter((a) => !predIds.has(a.id)),
    [activities, predIds],
  );
  const leaves = useMemo(
    () => activities.filter((a) => !succIds.has(a.id)),
    [activities, succIds],
  );

  const startPos = useMemo(() => {
    if (roots.length === 0) return null;
    const ys = roots.map((a) => positions[a.id]?.y).filter((y): y is number => y != null);
    const xs = roots.map((a) => positions[a.id]?.x).filter((x): x is number => x != null);
    if (!ys.length || !xs.length) return null;
    return { x: Math.min(...xs) - 150, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }, [roots, positions]);

  const endPos = useMemo(() => {
    if (leaves.length === 0) return null;
    const ys = leaves.map((a) => positions[a.id]?.y).filter((y): y is number => y != null);
    const xs = leaves.map((a) => positions[a.id]?.x).filter((x): x is number => x != null);
    if (!ys.length || !xs.length) return null;
    return { x: Math.max(...xs) + 150, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  }, [leaves, positions]);

  const criticalNumbers = criticalPath.join(' → ');
  const bounds = useMemo(
    () => diagramBounds(positions, startPos, endPos),
    [positions, startPos, endPos],
  );

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <DocumentsBackLink />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            PERT / CPM
          </span>
          <h1 className="mt-3 text-2xl font-bold text-text">Precedence Diagramming Method</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            Layout follows the sample PERT/CPM chart: <strong>START</strong> branches into
            parallel Day-1 activities, boxes show <strong>start day | end day</strong>, and
            Finish-to-Start work continues to <strong>END</strong>. Critical path (LF−EF = 0 and
            LS−ES = 0) is highlighted in red.
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
              className="mx-auto min-h-[320px] w-full max-w-6xl"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#2c2c2a" />
                </marker>
                <marker id="arrow-critical" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6" fill="#dc2626" />
                </marker>
              </defs>

              {startPos &&
                roots.map((a) => {
                  const to = positions[a.id];
                  if (!to) return null;
                  const edge = dependencyEdge(startPos, to);
                  return (
                    <line
                      key={`start-${a.id}`}
                      x1={startPos.x + 44}
                      y1={startPos.y}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke="#2c2c2a"
                      strokeWidth={1.5}
                      markerEnd="url(#arrow)"
                    />
                  );
                })}

              {endPos &&
                leaves.map((a) => {
                  const from = positions[a.id];
                  if (!from) return null;
                  return (
                    <line
                      key={`end-${a.id}`}
                      x1={from.x + NODE_HALF_W}
                      y1={from.y}
                      x2={endPos.x - 44}
                      y2={endPos.y}
                      stroke="#2c2c2a"
                      strokeWidth={1.5}
                      markerEnd="url(#arrow)"
                    />
                  );
                })}

              {dependencies.map((dep) => {
                const from = positions[dep.fromId];
                const to = positions[dep.toId];
                if (!from || !to) return null;
                const isCritical =
                  !!activities.find((a) => a.id === dep.fromId)?.isCritical &&
                  !!activities.find((a) => a.id === dep.toId)?.isCritical;
                const stroke = isCritical ? '#dc2626' : '#2c2c2a';
                const edge = dependencyEdge(from, to);
                if (edge.curved) {
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
                }
                return (
                  <line
                    key={dep.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={stroke}
                    strokeWidth={isCritical ? 3 : 1.5}
                    markerEnd={isCritical ? 'url(#arrow-critical)' : 'url(#arrow)'}
                  />
                );
              })}

              {startPos && <MilestoneNode label="START" x={startPos.x} y={startPos.y} />}
              {endPos && <MilestoneNode label="END" x={endPos.x} y={endPos.y} />}

              {activities.map((act) => {
                const pos = positions[act.id];
                if (!pos) return null;
                return <PdmNode key={act.id} activity={act} x={pos.x} y={pos.y} />;
              })}
            </svg>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-text-muted">
              <span>Each box: activity name · start day | end day</span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-6 bg-red-600" />
                Critical path (LF−EF = 0 and LS−ES = 0)
              </span>
              <span>Same start day = parallel (e.g. Billboard, Mobilization, Construction Safety)</span>
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
              <p className="mt-4 text-xs text-text-muted">
                Finish-to-Start (FS): the next activity starts the day after the previous one
                finishes (end day 10 → next start day 11), matching the sample chart.
              </p>
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
                    <th>Start</th>
                    <th>End</th>
                    <th>ES</th>
                    <th>EF</th>
                    <th>LS</th>
                    <th>LF</th>
                    <th>Critical</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => {
                    const { startDay, endDay } = pdmCalendarDays(a);
                    return (
                    <tr
                      key={a.id}
                      className={`border-b border-border/50 ${a.isCritical ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-2 font-medium">{a.number}</td>
                      <td>{a.name}</td>
                      <td>{a.duration}</td>
                      <td>{startDay}</td>
                      <td>{endDay}</td>
                      <td>{a.es}</td>
                      <td>{a.ef}</td>
                      <td>{a.ls}</td>
                      <td>{a.lf}</td>
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
