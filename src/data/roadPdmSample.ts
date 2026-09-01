import type { PdmActivity, PdmDependency } from '../types';

/** PDM training reference — Activities A–J (50 calendar days). */
export const REFERENCE_PDM_TITLE = 'PDM Training Reference (Activities A–J)';

const ACTS: { key: string; number: string; name: string; duration: number; esOverride?: number }[] = [
  { key: 'a', number: 'A', name: 'Activity A', duration: 10, esOverride: 1 },
  { key: 'b', number: 'B', name: 'Activity B', duration: 5 },
  { key: 'c', number: 'C', name: 'Activity C', duration: 15 },
  { key: 'd', number: 'D', name: 'Activity D', duration: 5 },
  { key: 'e', number: 'E', name: 'Activity E', duration: 20 },
  { key: 'f', number: 'F', name: 'Activity F', duration: 15 },
  { key: 'g', number: 'G', name: 'Activity G', duration: 10 },
  { key: 'h', number: 'H', name: 'Activity H', duration: 5 },
  { key: 'i', number: 'I', name: 'Activity I', duration: 10 },
  { key: 'j', number: 'J', name: 'Activity J', duration: 5 },
];

const DEPS: { from: string; to: string }[] = [
  { from: 'a', to: 'b' },
  { from: 'a', to: 'c' },
  { from: 'a', to: 'd' },
  { from: 'b', to: 'e' },
  { from: 'b', to: 'f' },
  { from: 'c', to: 'g' },
  { from: 'd', to: 'h' },
  { from: 'f', to: 'i' },
  { from: 'g', to: 'i' },
  { from: 'e', to: 'j' },
  { from: 'i', to: 'j' },
  { from: 'h', to: 'j' },
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
