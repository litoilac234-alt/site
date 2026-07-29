import type { Role } from '../types';

export type SwaStewaReportKind = 'SWA' | 'STEWA' | 'IAR';

/**
 * Whether this role may create or edit drafts for the given report type.
 * - Engineer I: all report types (SWA, STEWA, IAR)
 * - Engineer II: SWA and STEWA only
 * - Contractor: IAR only
 * - Everyone else: none
 */
export function canUserEditReportType(
  role: Role | undefined,
  reportType: SwaStewaReportKind,
): boolean {
  if (!role) return false;
  if (role === 'engineer_1') return true;
  if (role === 'engineer_2') return reportType === 'SWA' || reportType === 'STEWA';
  if (role === 'contractor') return reportType === 'IAR';
  return false;
}

/** Creation follows the same rules as editing. */
export function canUserCreateReportType(
  role: Role | undefined,
  reportType: SwaStewaReportKind,
): boolean {
  return canUserEditReportType(role, reportType);
}

/** A report is view-only for a role when that role cannot edit its type. */
export function reportIsViewOnly(
  role: Role | undefined,
  reportType: SwaStewaReportKind,
): boolean {
  return !canUserEditReportType(role, reportType);
}

export function contractorReportIsViewOnly(
  role: Role | undefined,
  reportType: SwaStewaReportKind,
): boolean {
  return role === 'contractor' && reportType !== 'IAR';
}
