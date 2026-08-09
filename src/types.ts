/** Contract roles: Engineer I–IV and Contractor */
export type Role =
  | 'engineer_1'
  | 'engineer_2'
  | 'engineer_3'
  | 'engineer_4'
  | 'contractor';

export interface User {
  id: number;
  email: string;
  role: Role;
  name: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  engineer_1: 'Engineer I',
  engineer_2: 'Engineer II',
  engineer_3: 'Engineer III',
  engineer_4: 'Engineer IV',
  contractor: 'Contractor',
};

export const ROLE_BADGES: Record<Role, string> = {
  engineer_1: 'E1',
  engineer_2: 'E2',
  engineer_3: 'E3',
  engineer_4: 'E4',
  contractor: 'CT',
};

export const DEMO_ACCOUNTS_BY_ROLE: Record<
  Role,
  { email: string; password: string; name: string }[]
> = {
  engineer_1: [
    { email: 'constructflow.engineer1.1@gmail.com', password: 'demo123', name: 'Engr. Juan Dela Cruz' },
    { email: 'constructflow.engineer1.2@gmail.com', password: 'demo123', name: 'Engr. Carlos Mendoza' },
    { email: 'constructflow.engineer1.3@gmail.com', password: 'demo123', name: 'Engr. Sofia Ramirez' },
  ],
  engineer_2: [
    { email: 'constructflow.engineer2.1@gmail.com', password: 'demo123', name: 'Engr. Maria Santos' },
    { email: 'constructflow.engineer2.2@gmail.com', password: 'demo123', name: 'Engr. Luis Garcia' },
    { email: 'constructflow.engineer2.3@gmail.com', password: 'demo123', name: 'Engr. Elena Cruz' },
  ],
  engineer_3: [
    { email: 'constructflow.engineer3.1@gmail.com', password: 'demo123', name: 'Engr. Pedro Reyes' },
  ],
  engineer_4: [
    { email: 'constructflow.engineer4.1@gmail.com', password: 'demo123', name: 'Engr. Ana Lopez' },
  ],
  contractor: [
    { email: 'constructflow.contractor.1@gmail.com', password: 'demo123', name: 'ABC Construction Corp.' },
    { email: 'constructflow.contractor.2@gmail.com', password: 'demo123', name: 'TS Construction' },
    { email: 'constructflow.contractor.3@gmail.com', password: 'demo123', name: 'North Builders Inc.' },
  ],
};

/** First demo account per role (backward compatible). */
export const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; name: string }> = {
  engineer_1: DEMO_ACCOUNTS_BY_ROLE.engineer_1[0],
  engineer_2: DEMO_ACCOUNTS_BY_ROLE.engineer_2[0],
  engineer_3: DEMO_ACCOUNTS_BY_ROLE.engineer_3[0],
  engineer_4: DEMO_ACCOUNTS_BY_ROLE.engineer_4[0],
  contractor: DEMO_ACCOUNTS_BY_ROLE.contractor[0],
};

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export type ReportType = 'SWA' | 'STEWA' | 'IAR' | 'PROGRESS';
export type ReportStatus =
  | 'draft'
  | 'submitted'
  | 'with_engineer_2'
  | 'revision_requested'
  | 'with_engineer_3'
  | 'approved';

export interface PdmActivity {
  id: string;
  number: string;
  name: string;
  duration: number;
  /** Optional 1-based Early Start day override (1 = Day 1). Null/undefined = use formula. */
  esOverride?: number | null;
  es?: number;
  ef?: number;
  ls?: number;
  lf?: number;
  isCritical?: boolean;
  posX?: number;
  posY?: number;
}

export interface PdmDependency {
  id: string;
  fromId: string;
  toId: string;
  type: DependencyType;
  lag?: number;
}

export interface BarChartTask {
  id: string;
  index: number;
  name: string;
  startDay: number;
  endDay: number;
  actualEndDay?: number;
}

export interface SCurvePoint {
  date: string;
  pointDate?: string;
  label?: string | null;
  originalPlan: number | null;
  currentPlan: number | null;
  actual: number | null;
}

export interface ProgressReport {
  id: string;
  projectName: string;
  type: ReportType;
  period: string;
  status: ReportStatus;
  submittedBy: string;
  submittedAt: string;
  qrCode: string;
  comments?: string;
}
