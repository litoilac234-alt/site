import { topologicalSort } from './pdm';
import type { PdmActivity, PdmDependency } from '../types';

export const PDM_COL_W = 168;
export const PDM_ROW_H = 132;
export const PDM_ORIGIN_X = 160;
export const PDM_ORIGIN_Y = 110;

function isAfSampleNetwork(activities: PdmActivity[]): boolean {
  return (
    activities.length > 0 &&
    activities.length <= 8 &&
    activities.every((a) => /^[A-F]$/.test(a.number))
  );
}

function isTrainingPdm(activities: PdmActivity[]): boolean {
  return (
    activities.length > 0 &&
    activities.length <= 12 &&
    activities.every((a) => /^[A-J]$/.test(a.number)) &&
    !isAfSampleNetwork(activities)
  );
}

/**
 * Paper PDM lanes — A–F sample, A–J training, or road project.
 */
export function paperLane(activity: PdmActivity, allActivities: PdmActivity[] = []): number {
  if (isAfSampleNetwork(allActivities)) {
    const n = activity.number;
    if (n === 'A' || n === 'B' || n === 'C') return 0;
    if (n === 'D' || n === 'E' || n === 'F') return 2;
    return 1;
  }

  if (isTrainingPdm(allActivities)) {
    const n = activity.number;
    if (n === 'A') return 2;
    if (n === 'C' || n === 'G' || n === 'I') return 0;
    if (n === 'B' || n === 'E' || n === 'F') return 1;
    if (n === 'D' || n === 'H') return 3;
    if (n === 'J') return 2;
    return 2;
  }

  const n = activity.number;
  const name = (activity.name ?? '').toLowerCase();
  if (name.includes('safety') || name.includes('health program')) return 0;
  if (n === 'B.5' || n.startsWith('A.1')) return 1;
  if (n.startsWith('311(2)')) return 3;
  if (n === '404(1)b' && activity.duration > 1) return 3;
  if (n === '404(1)b') return 2;
  if (n === '404(1)a' && activity.duration === 1) return 2;
  if (n.startsWith('404') && activity.duration > 1) return 3;
  if (n.startsWith('405') && activity.duration >= 20) return 3;
  return 2;
}

/** Columns by dependency depth; rows by paper lane (not ES — avoids duplicate-number overlap). */
export function layoutPaperNetwork(
  activities: PdmActivity[],
  dependencies: PdmDependency[],
): Record<string, { x: number; y: number }> {
  const topo = topologicalSort(activities, dependencies);
  if (!topo) return {};

  const preds = new Map<string, string[]>();
  for (const d of dependencies) {
    if (!preds.has(d.toId)) preds.set(d.toId, []);
    preds.get(d.toId)!.push(d.fromId);
  }

  const col: Record<string, number> = {};
  for (const id of topo) {
    const ps = preds.get(id) ?? [];
    col[id] = ps.length === 0 ? 0 : Math.max(...ps.map((p) => col[p] ?? 0)) + 1;
  }

  const groups = new Map<number, PdmActivity[]>();
  for (const a of activities) {
    const c = col[a.id] ?? 0;
    const list = groups.get(c) ?? [];
    list.push(a);
    groups.set(c, list);
  }

  const map: Record<string, { x: number; y: number }> = {};
  [...groups.keys()]
    .sort((a, b) => a - b)
    .forEach((c) => {
      const group = groups.get(c) ?? [];
      const usedY = new Map<number, number>();
      group
        .sort(
          (a, b) =>
            paperLane(a, activities) - paperLane(b, activities) ||
            (a.es ?? 0) - (b.es ?? 0) ||
            a.name.localeCompare(b.name),
        )
        .forEach((a) => {
          const lane = paperLane(a, activities);
          const offset = usedY.get(lane) ?? 0;
          usedY.set(lane, offset + 1);
          map[a.id] = {
            x: PDM_ORIGIN_X + c * PDM_COL_W,
            y: PDM_ORIGIN_Y + lane * PDM_ROW_H + offset * 24,
          };
        });
    });

  return map;
}

export function diagramBounds(
  positions: Record<string, { x: number; y: number }>,
  nodeHalfW: number,
  nodeHalfH: number,
) {
  const pad = 72;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  Object.values(positions).forEach((p) => {
    minX = Math.min(minX, p.x - nodeHalfW);
    maxX = Math.max(maxX, p.x + nodeHalfW);
    minY = Math.min(minY, p.y - nodeHalfH);
    maxY = Math.max(maxY, p.y + nodeHalfH);
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
