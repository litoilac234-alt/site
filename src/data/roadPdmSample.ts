import type { PdmActivity, PdmDependency } from '../types';

/** Precedence diagram sample — Activities A–F. */
export const REFERENCE_PDM_TITLE = 'Precedence Diagram Sample (Activities A–F)';

const ACTS: { key: string; number: string; name: string; duration: number; esOverride?: number }[] = [
  { key: 'a', number: 'A', name: 'Activity A', duration: 3, esOverride: 1 },
  { key: 'b', number: 'B', name: 'Activity B', duration: 4 },
  { key: 'c', number: 'C', name: 'Activity C', duration: 2 },
  { key: 'd', number: 'D', name: 'Activity D', duration: 5, esOverride: 1 },
  { key: 'e', number: 'E', name: 'Activity E', duration: 2 },
  { key: 'f', number: 'F', name: 'Activity F', duration: 3 },
];

const DEPS: { from: string; to: string }[] = [
  { from: 'a', to: 'b' },
  { from: 'b', to: 'c' },
  { from: 'd', to: 'c' },
  { from: 'd', to: 'e' },
  { from: 'e', to: 'f' },
];

export const HAS_REFERENCE_PDM = ACTS.length > 0;

export function buildRoadPdmSample(): { activities: PdmActivity[]; dependencies: PdmDependency[] } {
  const activities: PdmActivity[] = ACTS.map((a) => ({
    id: `sample-${a.key}`,
    number: a.number,
    name: a.name,
    duration: a.duration,
    esOverride: a.esOverride ?? null,
  }));
  const dependencies: PdmDependency[] = DEPS.map((d, i) => ({
    id: `sample-d-${i}`,
    fromId: `sample-${d.from}`,
    toId: `sample-${d.to}`,
    type: 'FS',
    lag: 0,
  }));
  return { activities, dependencies };
}
