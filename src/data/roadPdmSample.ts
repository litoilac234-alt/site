import type { PdmActivity, PdmDependency } from '../types';

/** PERT/CPM reference — Remebella, Buguey, Cagayan (110 calendar days). */
export const REFERENCE_PDM_TITLE =
  'Improvement of Roads - 1st District - Concreting of Barangay Road, Remebella, Buguey, Cagayan';

const ACTS: { key: string; number: string; name: string; duration: number; esOverride?: number }[] = [
  { key: 'b5', number: 'B.5', name: 'Project Billboard', duration: 1, esOverride: 1 },
  {
    key: 'a111',
    number: 'A.1.1(11)',
    name: 'Provision of Furnitures/Fixtures, etc. for the Field Office for the Engineer',
    duration: 10,
    esOverride: 1,
  },
  { key: 'b9', number: 'B.9', name: 'Mobilization / Demobilization', duration: 10, esOverride: 1 },
  {
    key: 'b7',
    number: 'B.7',
    name: 'Construction Safety & Health Program',
    duration: 110,
    esOverride: 1,
  },
  {
    key: 'r1013',
    number: '101(3)b3',
    name: 'Removal of Actual Structures/Obstructions, 0.23m thk. PCCP (Unreinforced)',
    duration: 5,
  },
  {
    key: 'r1014',
    number: '101(4)a1',
    name: 'Removal of Actual Structures/Obstructions, 610mm dia. RCPC',
    duration: 3,
  },
  { key: 'r404a', number: '404(1)a', name: 'Reinforcing Steel, Grade 40', duration: 1 },
  { key: 'r404b', number: '404(1)b', name: 'Reinforcing Steel, Grade 60', duration: 1 },
  {
    key: 'r500',
    number: '500(1)a3',
    name: 'Reinforced Concrete Pipe Culvert, 910mm dia. Class IV',
    duration: 3,
  },
  {
    key: 'r405c',
    number: '405(1)a3',
    name: 'Structural Concrete Class A, 20.68MPa @ 28 days',
    duration: 1,
  },
  {
    key: 'e1041',
    number: '104(1)a',
    name: 'Embankment from Roadway Excavation (Common Soil)',
    duration: 15,
  },
  {
    key: 'e1042',
    number: '104(2)a',
    name: 'Embankment (From Borrow, Common Soil)',
    duration: 10,
  },
  { key: 'e103', number: '103(1)a', name: 'Structure Excavation (Common Soil)', duration: 15 },
  { key: 'e105', number: '105(1)', name: 'Sub-Grade Preparation (Common Material)', duration: 3 },
  { key: 'e200', number: '200(1)', name: 'Aggregate Sub-Base Course', duration: 15 },
  {
    key: 'p311u',
    number: '311(1)c1',
    name: 'Portland Cement Concrete Pavement (Unreinforced), 0.23m thk. 14 days',
    duration: 30,
  },
  { key: 'r404a2', number: '404(1)a', name: 'Reinforcing Steel, Grade 40 (continued)', duration: 30 },
  { key: 'r404b2', number: '404(1)b', name: 'Reinforcing Steel, Grade 60 (Retaining Wall)', duration: 20 },
  {
    key: 'r405p',
    number: '405(1)a3',
    name: 'Structural Concrete Class A, 20.68MPa @ 28 days (continued)',
    duration: 30,
  },
  {
    key: 'p311r',
    number: '311(2)e1',
    name: 'Portland Cement Concrete Pavement (Reinforced), 0.28m thk. 14 days',
    duration: 1,
  },
];

const DEPS: { from: string; to: string; lag?: number }[] = [
  { from: 'b9', to: 'r1013' },
  { from: 'r1013', to: 'r1014' },
  { from: 'r1014', to: 'r404a' },
  { from: 'r1014', to: 'r404b' },
  { from: 'r404a', to: 'r500' },
  { from: 'r404a', to: 'r404a2' },
  { from: 'r500', to: 'r405c' },
  { from: 'r405c', to: 'e1041' },
  { from: 'e1041', to: 'e1042', lag: -1 },
  { from: 'e1042', to: 'e103' },
  { from: 'e103', to: 'e105' },
  { from: 'e105', to: 'e200' },
  { from: 'e200', to: 'p311u' },
  { from: 'r404a2', to: 'r404b2' },
  { from: 'r404b2', to: 'r405p' },
  { from: 'r405p', to: 'p311r', lag: 10 },
];

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
