import type { PdmActivity } from '../types';

export const PDM_NODE_W = 132;
export const PDM_NODE_H = 102;

interface PdmNodeProps {
  activity: PdmActivity;
  x: number;
  y: number;
  /** Free float (days). */
  freeFloat?: number;
  /** Total float (days). */
  totalFloat?: number;
}

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

/**
 * PDM activity box matching the classic template:
 * Top:    FF (blue) | TF (white) | DUR (orange)
 * Middle: Activity name (green)
 * Bottom: ES | EF
 *         LS | LF
 */
export function PdmNode({ activity, x, y, freeFloat = 0, totalFloat = 0 }: PdmNodeProps) {
  const w = PDM_NODE_W;
  const h = PDM_NODE_H;
  const critical = activity.isCritical;
  const topH = 28;
  const midH = 30;
  const botH = h - topH - midH;
  const col = w / 3;

  const name = activity.name?.trim() || activity.number;
  const label = `${activity.number}${activity.name && activity.name !== activity.number ? ` — ${activity.name}` : ''}`;
  const displayName = activity.name?.trim() ? activity.name : activity.number;
  const nameFontSize = displayName.length > 22 ? 8 : displayName.length > 12 ? 9 : 10;
  const maxChars = Math.max(4, Math.floor((w - 12) / (nameFontSize * 0.55)));
  let nameLines = wrapLines(displayName, maxChars).slice(0, 2);
  if (nameLines.length === 2 && wrapLines(displayName, maxChars).length > 2) {
    nameLines[1] = `${nameLines[1].slice(0, Math.max(1, maxChars - 1))}…`;
  }
  const nameLineHeight = nameFontSize + 2;
  const nameBlockH = nameLines.length * nameLineHeight;
  const nameStartY = topH + midH / 2 - nameBlockH / 2 + nameFontSize;

  const ff = freeFloat;
  const tf = totalFloat;
  const dur = activity.duration;

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <title>{`${label}\nFF=${ff}  TF=${tf}  DUR=${dur}\nES=${activity.es ?? '—'} EF=${activity.ef ?? '—'}\nLS=${activity.ls ?? '—'} LF=${activity.lf ?? '—'}`}</title>

      {/* Outer frame */}
      <rect
        width={w}
        height={h}
        rx={2}
        fill="#fff"
        stroke={critical ? '#c00000' : '#333'}
        strokeWidth={critical ? 2.5 : 1.5}
      />

      {/* Top row fills: FF | TF | DUR */}
      <rect x={0} y={0} width={col} height={topH} fill="#5b9bd5" stroke="#333" strokeWidth={1} />
      <rect x={col} y={0} width={col} height={topH} fill="#fff" stroke="#333" strokeWidth={1} />
      <rect x={col * 2} y={0} width={col} height={topH} fill="#ed7d31" stroke="#333" strokeWidth={1} />

      <text x={col / 2} y={11} textAnchor="middle" className="fill-white text-[7px] font-bold">
        FF
      </text>
      <text x={col / 2} y={23} textAnchor="middle" className="fill-white text-[11px] font-bold">
        {ff}
      </text>

      <text x={col + col / 2} y={11} textAnchor="middle" className="fill-text-muted text-[7px] font-bold">
        TF
      </text>
      <text x={col + col / 2} y={23} textAnchor="middle" className="fill-text text-[11px] font-bold">
        {tf}
      </text>

      <text x={col * 2 + col / 2} y={11} textAnchor="middle" className="fill-white text-[7px] font-bold">
        DUR
      </text>
      <text x={col * 2 + col / 2} y={23} textAnchor="middle" className="fill-white text-[11px] font-bold">
        {dur}
      </text>

      {/* Middle: activity name */}
      <rect x={0} y={topH} width={w} height={midH} fill="#70ad47" stroke="#333" strokeWidth={1} />
      {nameLines.map((line, i) => (
        <text
          key={i}
          x={w / 2}
          y={nameStartY + i * nameLineHeight}
          textAnchor="middle"
          fontSize={nameFontSize}
          fontWeight={700}
          className="fill-white"
        >
          {line}
        </text>
      ))}

      {/* Bottom 2×2: ES EF / LS LF */}
      <line x1={0} y1={topH + midH} x2={w} y2={topH + midH} stroke="#333" strokeWidth={1} />
      <line x1={w / 2} y1={topH + midH} x2={w / 2} y2={h} stroke="#333" strokeWidth={1} />
      <line x1={0} y1={topH + midH + botH / 2} x2={w} y2={topH + midH + botH / 2} stroke="#333" strokeWidth={1} />

      <text x={w / 4} y={topH + midH + 10} textAnchor="middle" className="fill-text-muted text-[7px]">
        ES
      </text>
      <text x={w / 4} y={topH + midH + botH / 2 - 4} textAnchor="middle" className="fill-text text-[11px] font-bold">
        {activity.es ?? '—'}
      </text>

      <text x={(w * 3) / 4} y={topH + midH + 10} textAnchor="middle" className="fill-text-muted text-[7px]">
        EF
      </text>
      <text
        x={(w * 3) / 4}
        y={topH + midH + botH / 2 - 4}
        textAnchor="middle"
        className="fill-text text-[11px] font-bold"
      >
        {activity.ef ?? '—'}
      </text>

      <text x={w / 4} y={topH + midH + botH / 2 + 10} textAnchor="middle" className="fill-text-muted text-[7px]">
        LS
      </text>
      <text x={w / 4} y={h - 5} textAnchor="middle" className="fill-text text-[11px] font-bold">
        {activity.ls ?? '—'}
      </text>

      <text x={(w * 3) / 4} y={topH + midH + botH / 2 + 10} textAnchor="middle" className="fill-text-muted text-[7px]">
        LF
      </text>
      <text x={(w * 3) / 4} y={h - 5} textAnchor="middle" className="fill-text text-[11px] font-bold">
        {activity.lf ?? '—'}
      </text>
    </g>
  );
}
