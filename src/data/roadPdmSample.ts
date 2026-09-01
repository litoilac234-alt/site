import type { PdmActivity, PdmDependency } from '../types';

/** Placeholder until a new reference PDM is provided. */
export const REFERENCE_PDM_TITLE = 'PEO Monitoring Project';

export const HAS_REFERENCE_PDM = false;

const ACTS: { key: string; number: string; name: string; duration: number; esOverride?: number }[] = [];

const DEPS: { from: string; to: string; lag?: number }[] = [];

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
    lag: d.lag ?? 0,
  }));
  return { activities, dependencies };
}
