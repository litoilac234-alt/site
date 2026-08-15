import type { PdmActivity } from '../types';

interface PdmNodeProps {
  activity: PdmActivity;
  x: number;
  y: number;
}

export const PDM_NODE_W = 168;
export const PDM_NODE_H = 72;

/** Wrap text into lines that fit within maxChars, breaking overly long words. */
function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current);
        current = '';
      }
      let rest = word;
      while (rest.length > maxChars) {
        lines.push(rest.slice(0, maxChars));
        rest = rest.slice(maxChars);
      }
      current = rest;
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** 1-based calendar days, matching the PEO PERT/CPM sample (start 1, inclusive finish). */
export function pdmCalendarDays(activity: PdmActivity): { startDay: number; endDay: number } {
  const startDay = (activity.es ?? 0) + 1;
  const endDay = Math.max(startDay, activity.ef ?? startDay);
  return { startDay, endDay };
}

/**
 * Sample PERT/CPM box: activity title on top, start day | end day on the bottom.
 */
export function PdmNode({ activity, x, y }: PdmNodeProps) {
  const w = PDM_NODE_W;
  const h = PDM_NODE_H;
  const critical = activity.isCritical;
  const splitY = h - 26;
  const { startDay, endDay } = pdmCalendarDays(activity);

  const title = `${activity.number} ${activity.name ?? ''}`.trim();
  const nameFontSize = title.length > 42 ? 7 : title.length > 28 ? 8 : 9;
  const maxChars = Math.max(4, Math.floor((w - 12) / (nameFontSize * 0.56)));
  const maxLines = 2;
  let nameLines = wrapLines(title, maxChars);
  if (nameLines.length > maxLines) {
    nameLines = nameLines.slice(0, maxLines);
    const last = nameLines[maxLines - 1].slice(0, Math.max(1, maxChars - 1)).replace(/\s+$/, '');
    nameLines[maxLines - 1] = `${last}…`;
  }
  const nameLineHeight = nameFontSize + 2;
  const nameStartY = 14 + nameFontSize / 2;

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <title>{`${title} · Day ${startDay}–${endDay}`}</title>
      <rect
        width={w}
        height={h}
        rx={3}
        fill={critical ? '#fef2f2' : '#fff'}
        stroke={critical ? '#dc2626' : '#2c2c2a'}
        strokeWidth={critical ? 2.5 : 1.5}
      />
      <line x1={0} y1={splitY} x2={w} y2={splitY} stroke={critical ? '#dc2626' : '#2c2c2a'} />
      <line x1={w / 2} y1={splitY} x2={w / 2} y2={h} stroke={critical ? '#dc2626' : '#2c2c2a'} />

      {nameLines.map((line, i) => (
        <text
          key={i}
          x={w / 2}
          y={nameStartY + i * nameLineHeight}
          textAnchor="middle"
          fontSize={nameFontSize}
          className="fill-text font-semibold"
        >
          {line}
        </text>
      ))}

      <text x={w / 4} y={h - 8} textAnchor="middle" className="fill-text text-[13px] font-bold">
        {startDay}
      </text>
      <text x={(w * 3) / 4} y={h - 8} textAnchor="middle" className="fill-text text-[13px] font-bold">
        {endDay}
      </text>
    </g>
  );
}

export function MilestoneNode({
  label,
  x,
  y,
}: {
  label: string;
  x: number;
  y: number;
}) {
  const w = 88;
  const h = 36;
  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <rect width={w} height={h} rx={18} fill="#2c2c2a" />
      <text
        x={w / 2}
        y={h / 2 + 5}
        textAnchor="middle"
        className="fill-white text-[12px] font-bold"
      >
        {label}
      </text>
    </g>
  );
}
