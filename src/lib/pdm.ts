import type { DependencyType, PdmActivity, PdmDependency } from '../types';

/**
 * Forward/backward pass for PDM scheduling.
 * Supports FS, SS, FF, SF dependency types with optional lag.
 */
export function calculatePdmSchedule(
  activities: PdmActivity[],
  dependencies: PdmDependency[],
): PdmActivity[] {
  const map = new Map(activities.map((a) => [a.id, { ...a }]));
  const preds = new Map<string, PdmDependency[]>();
  const succs = new Map<string, PdmDependency[]>();

  for (const dep of dependencies) {
    if (!preds.has(dep.toId)) preds.set(dep.toId, []);
    if (!succs.has(dep.fromId)) succs.set(dep.fromId, []);
    preds.get(dep.toId)!.push(dep);
    succs.get(dep.fromId)!.push(dep);
  }

  const topo = topologicalSort(activities, dependencies);
  if (!topo) return activities;

  for (const id of topo) {
    const act = map.get(id)!;
    const incoming = preds.get(id) ?? [];
    if (incoming.length === 0) {
      act.es = 0;
    } else {
      act.es = Math.max(
        ...incoming.map((dep) => {
          const pred = map.get(dep.fromId)!;
          const lag = dep.lag ?? 0;
          switch (dep.type) {
            case 'FS':
              return (pred.ef ?? 0) + lag;
            case 'SS':
              return (pred.es ?? 0) + lag;
            case 'FF':
              return (pred.ef ?? 0) + lag - act.duration;
            case 'SF':
              return (pred.es ?? 0) + lag - act.duration;
            default:
              return 0;
          }
        }),
      );
    }

    // Optional 1-based Early Start override (e.g. 1 = start Day 1 in parallel).
    // When unset, keep the formula ES above.
    if (act.esOverride != null && act.esOverride >= 1) {
      act.es = act.esOverride - 1;
    }

    act.ef = act.es + act.duration;
  }

  const projectEnd = Math.max(...[...map.values()].map((a) => a.ef ?? 0));

  for (const id of [...topo].reverse()) {
    const act = map.get(id)!;
    const outgoing = succs.get(id) ?? [];
    if (outgoing.length === 0) {
      act.lf = projectEnd;
    } else {
      act.lf = Math.min(
        ...outgoing.map((dep) => {
          const succ = map.get(dep.toId)!;
          const lag = dep.lag ?? 0;
          switch (dep.type) {
            case 'FS':
              return (succ.ls ?? projectEnd) - lag;
            case 'SS':
              return (succ.ls ?? projectEnd) - lag;
            case 'FF':
              return (succ.lf ?? projectEnd) - lag;
            case 'SF':
              return (succ.lf ?? projectEnd) - lag + act.duration;
            default:
              return projectEnd;
          }
        }),
      );
    }
    act.ls = act.lf - act.duration;
    // Critical when total float is zero: (LF − EF) = 0 and (LS − ES) = 0.
    const es = act.es ?? 0;
    const ef = act.ef ?? 0;
    const ls = act.ls ?? 0;
    const lf = act.lf ?? 0;
    act.isCritical = lf - ef === 0 && ls - es === 0;
  }

  return [...map.values()];
}

function topologicalSort(
  activities: PdmActivity[],
  dependencies: PdmDependency[],
): string[] | null {
  const inDegree = new Map(activities.map((a) => [a.id, 0]));
  const adj = new Map<string, string[]>();

  for (const a of activities) adj.set(a.id, []);
  for (const dep of dependencies) {
    adj.get(dep.fromId)?.push(dep.toId);
    inDegree.set(dep.toId, (inDegree.get(dep.toId) ?? 0) + 1);
  }

  const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const result: string[] = [];

  while (queue.length) {
    const id = queue.shift()!;
    result.push(id);
    for (const next of adj.get(id) ?? []) {
      const deg = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }

  return result.length === activities.length ? result : null;
}

export function getCriticalPath(
  activities: PdmActivity[],
  dependencies: PdmDependency[] = [],
): PdmActivity[] {
  const projectEnd = Math.max(...activities.map((a) => a.ef ?? 0), 0);
  const byId = new Map(activities.map((a) => [a.id, a]));
  const preds = new Map<string, PdmDependency[]>();
  for (const dep of dependencies) {
    if (!preds.has(dep.toId)) preds.set(dep.toId, []);
    preds.get(dep.toId)!.push(dep);
  }

  const terminals = activities.filter(
    (a) => a.isCritical && (a.ef ?? 0) === projectEnd,
  );
  if (terminals.length === 0) {
    return activities.filter((a) => a.isCritical).sort((a, b) => (a.es ?? 0) - (b.es ?? 0));
  }

  let bestIds: string[] = [];
  for (const terminal of terminals) {
    const chain: string[] = [];
    let id = terminal.id;
    while (true) {
      chain.push(id);
      const criticalPreds = (preds.get(id) ?? []).filter((dep) => byId.get(dep.fromId)?.isCritical);
      if (criticalPreds.length === 0) break;
      criticalPreds.sort(
        (a, b) => (byId.get(b.fromId)?.ef ?? 0) - (byId.get(a.fromId)?.ef ?? 0),
      );
      id = criticalPreds[0].fromId;
    }
    const ordered = chain.reverse();
    if (ordered.length > bestIds.length) bestIds = ordered;
  }

  return bestIds.map((id) => byId.get(id)!).filter(Boolean);
}

export const DEPENDENCY_LABELS: Record<DependencyType, string> = {
  FS: 'Finish-to-Start',
  SS: 'Start-to-Start',
  FF: 'Finish-to-Finish',
  SF: 'Start-to-Finish',
};
