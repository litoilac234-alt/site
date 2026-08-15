import type { PdmActivity } from '../types';

interface PdmNodeProps {
  activity: PdmActivity;
  x: number;
  y: number;
}

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

export function PdmNode({ activity, x, y }: PdmNodeProps) {
  const w = 120;
  const h = 90;
  const critical = activity.isCritical;
  const row1 = h / 3;
  const row2 = (h * 2) / 3;

  // Fit the activity name inside the node: shrink for longer names, wrap to
  // multiple lines, and truncate with an ellipsis if it still overflows.
  const name = activity.name ?? '';
  const nameFontSize = name.length > 26 ? 7 : name.length > 14 ? 8 : 9;
  const maxChars = Math.max(4, Math.floor((w - 10) / (nameFontSize * 0.56)));
  const maxLines = nameFontSize >= 9 ? 2 : 3;
  let nameLines = wrapLines(name, maxChars);
  if (nameLines.length > maxLines) {
    nameLines = nameLines.slice(0, maxLines);
    const last = nameLines[maxLines - 1].slice(0, Math.max(1, maxChars - 1)).replace(/\s+$/, '');
    nameLines[maxLines - 1] = `${last}…`;
  }
  const nameLineHeight = nameFontSize + 2;
  const nameStartY = h / 2 - ((nameLines.length - 1) * nameLineHeight) / 2 + nameFontSize / 2 - 1;

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <title>{name}</title>
      <rect
        width={w}
        height={h}
        rx={4}
        fill={critical ? '#fef2f2' : '#fff'}
        stroke={critical ? '#dc2626' : '#4a6353'}
        strokeWidth={critical ? 2.75 : 1.5}
      />
      <line x1={0} y1={row1} x2={w} y2={row1} stroke="#e0dfd8" />
      <line x1={0} y1={row2} x2={w} y2={row2} stroke="#e0dfd8" />
      <line x1={w / 3} y1={0} x2={w / 3} y2={row1} stroke="#e0dfd8" />
      <line x1={(w * 2) / 3} y1={0} x2={(w * 2) / 3} y2={row1} stroke="#e0dfd8" />
      <line x1={w / 3} y1={row2} x2={w / 3} y2={h} stroke="#e0dfd8" />
      <line x1={(w * 2) / 3} y1={row2} x2={(w * 2) / 3} y2={h} stroke="#e0dfd8" />

      {/* Top row — ES / No. / EF */}
      <text x={w / 6} y={11} textAnchor="middle" className="fill-text-muted text-[8px]">
        ES
      </text>
      <text x={w / 2} y={11} textAnchor="middle" className="fill-text-muted text-[8px]">
        No.
      </text>
      <text x={(w * 5) / 6} y={11} textAnchor="middle" className="fill-text-muted text-[8px]">
        EF
      </text>
      <text x={w / 6} y={24} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.es == null ? '—' : activity.es + 1}
      </text>
      <text x={w / 2} y={24} textAnchor="middle" className="fill-text text-[11px] font-bold">
        {activity.number}
      </text>
      <text x={(w * 5) / 6} y={24} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.ef ?? '—'}
      </text>

      {/* Middle — activity name (wrapped / scaled to fit) */}
      {nameLines.map((line, i) => (
        <text
          key={i}
          x={w / 2}
          y={nameStartY + i * nameLineHeight}
          textAnchor="middle"
          fontSize={nameFontSize}
          className="fill-text"
        >
          {line}
        </text>
      ))}

      {/* Bottom row — LS / D / LF */}
      <text x={w / 6} y={row2 + 12} textAnchor="middle" className="fill-text-muted text-[8px]">
        LS
      </text>
      <text x={w / 2} y={row2 + 12} textAnchor="middle" className="fill-text-muted text-[8px]">
        D
      </text>
      <text x={(w * 5) / 6} y={row2 + 12} textAnchor="middle" className="fill-text-muted text-[8px]">
        LF
      </text>
      <text x={w / 6} y={row2 + 26} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.ls == null ? '—' : activity.ls + 1}
      </text>
      <text x={w / 2} y={row2 + 26} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.duration}
      </text>
      <text x={(w * 5) / 6} y={row2 + 26} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.lf ?? '—'}
      </text>
    </g>
  );
}
