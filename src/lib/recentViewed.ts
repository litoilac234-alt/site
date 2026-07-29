const VIEWED_KEY = 'sitetrack_recent_viewed_reports';
const MAX_VIEWED = 12;

export function getRecentlyViewedReportIds(): number[] {
  try {
    const raw = localStorage.getItem(VIEWED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

export function trackReportViewed(reportId: number): void {
  if (!reportId || reportId <= 0) return;
  const prev = getRecentlyViewedReportIds().filter((id) => id !== reportId);
  const next = [reportId, ...prev].slice(0, MAX_VIEWED);
  localStorage.setItem(VIEWED_KEY, JSON.stringify(next));
}
