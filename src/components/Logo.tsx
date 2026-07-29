import { AGENCY_NAME, OFFICE_NAME, PEO_LOGO } from '../lib/branding';

interface LogoProps {
  size?: 'sm' | 'md';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const box = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${box} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-1 shadow-sm`}
        title={OFFICE_NAME}
      >
        <img src={PEO_LOGO} alt={OFFICE_NAME} className="h-full w-full object-contain" />
      </div>
      {showText && (
        <div className="text-left">
          <p className={`${textSize} font-bold leading-tight text-text`}>{OFFICE_NAME}</p>
          {size === 'md' && (
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              {AGENCY_NAME}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
