import type { PdmActivity } from '../types';

export const PDM_NODE_W = 136;
export const PDM_NODE_H = 118;
export const PDM_NODE_HALF_W = PDM_NODE_W / 2;
export const PDM_NODE_HALF_H = PDM_NODE_H / 2;

interface PdmNodeProps {
  activity: PdmActivity;
  x: number;
  y: number;
  freeFloat?: number;
  totalFloat?: number;
  onMainCriticalPath?: boolean;
}

export function PdmNode({
  activity,
  x,
  y,
  freeFloat = 0,
  totalFloat = 0,
  onMainCriticalPath = false,
}: PdmNodeProps) {
  const w = PDM_NODE_W;
  const h = PDM_NODE_H;
  const topH = 28;
  const midH = 28;
  const botY = topH + midH;
  const cellH = (h - botY) / 2;
  const col = w / 3;
  const displayName = activity.name?.trim() || activity.number;

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`}>
      <title>{displayName}</title>
      <rect
        width={w}
        height={h}
        rx={4}
        fill={onMainCriticalPath ? '#fef2f2' : '#fff'}
        stroke={onMainCriticalPath ? '#dc2626' : '#4a6353'}
        strokeWidth={onMainCriticalPath ? 2.75 : 1.5}
      />

      {/* FF / TF / DUR */}
      <rect x={0} y={0} width={col} height={topH} fill="#5b9bd5" opacity={0.15} />
      <rect x={col} y={0} width={col} height={topH} fill="#fff" />
      <rect x={col * 2} y={0} width={col} height={topH} fill="#ed7d31" opacity={0.2} />
      <line x1={0} y1={topH} x2={w} y2={topH} stroke="#e0dfd8" />
      <line x1={col} y1={0} x2={col} y2={topH} stroke="#e0dfd8" />
      <line x1={col * 2} y1={0} x2={col * 2} y2={topH} stroke="#e0dfd8" />

      <text x={col / 2} y={10} textAnchor="middle" className="fill-text-muted text-[7px]">
        FF
      </text>
      <text x={col * 1.5} y={10} textAnchor="middle" className="fill-text-muted text-[7px]">
        TF
      </text>
      <text x={col * 2.5} y={10} textAnchor="middle" className="fill-text-muted text-[7px]">
        DUR
      </text>
      <text x={col / 2} y={22} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {freeFloat}
      </text>
      <text x={col * 1.5} y={22} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {totalFloat}
      </text>
      <text x={col * 2.5} y={22} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.duration}
      </text>

      {/* Activity name */}
      <rect x={0} y={topH} width={w} height={midH} fill="#70ad47" opacity={0.12} />
      <line x1={0} y1={botY} x2={w} y2={botY} stroke="#e0dfd8" />
      <text
        x={w / 2}
        y={topH + midH / 2 + 4}
        textAnchor="middle"
        className="fill-text text-[11px] font-bold"
      >
        {activity.number}
      </text>

      {/* ES / EF and LS / LF */}
      <line x1={col} y1={botY} x2={col} y2={h} stroke="#e0dfd8" />
      <text x={col / 2} y={botY + 11} textAnchor="middle" className="fill-text-muted text-[7px]">
        ES
      </text>
      <text x={(col * 3) / 2} y={botY + 11} textAnchor="middle" className="fill-text-muted text-[7px]">
        EF
      </text>
      <text x={col / 2} y={botY + cellH + 11} textAnchor="middle" className="fill-text-muted text-[7px]">
        LS
      </text>
      <text x={(col * 3) / 2} y={botY + cellH + 11} textAnchor="middle" className="fill-text-muted text-[7px]">
        LF
      </text>
      <line x1={0} y1={botY + cellH} x2={w} y2={botY + cellH} stroke="#e0dfd8" />

      <text x={col / 2} y={botY + 24} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.es == null ? '—' : activity.es + 1}
      </text>
      <text x={(col * 3) / 2} y={botY + 24} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.ef ?? '—'}
      </text>
      <text x={col / 2} y={botY + cellH + 24} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.ls == null ? '—' : activity.ls + 1}
      </text>
      <text x={(col * 3) / 2} y={botY + cellH + 24} textAnchor="middle" className="fill-text text-[10px] font-semibold">
        {activity.lf ?? '—'}
      </text>
    </g>
  );
}
