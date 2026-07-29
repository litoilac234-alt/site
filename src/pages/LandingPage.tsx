import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-[#f0efe9] to-surface-muted">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="inline-flex rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-sm backdrop-blur">
          <Logo />
        </div>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-block rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Email-based progress monitoring
            </span>
            <h1 className="mt-6 font-serif text-4xl leading-tight text-text md:text-5xl">
              PDM schedules, S-curves, and approvals in one workspace.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-text-muted">
              Automated workflow system for the Provincial Engineer&apos;s Office —
              track weekly progress, generate SWA/STEWA/Progress reports, compute
              critical paths, and route approvals through email.
            </p>
            <Link
              to="/roles"
              className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-dark"
            >
              Choose access role
            </Link>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { title: 'PDM Scheduling', desc: 'Critical path & dependencies' },
                { title: 'S-Curve & Bar Chart', desc: 'Planned vs actual progress' },
                { title: 'Email workflow', desc: 'Engineer I → II → III approval' },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm"
                >
                  <p className="font-semibold text-text">{card.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            <HeroIllustration />
            <div className="grid grid-cols-3 gap-px bg-primary text-white">
              {[
                { title: 'PDM', desc: 'Network diagram & critical path' },
                { title: 'Reports', desc: 'SWA, STEWA, Progress + QR' },
                { title: 'Approvals', desc: 'Email with Approve / Revise' },
              ].map((item) => (
                <div key={item.title} className="bg-primary px-4 py-4">
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="mt-1 text-[10px] opacity-85">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroIllustration() {
  return (
    <div className="relative h-72 bg-gradient-to-b from-primary-light to-surface-muted p-8">
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 400 200" preserveAspectRatio="none">
        <path d="M0 160 Q100 120 200 140 T400 100 L400 200 L0 200 Z" fill="#c5d4c8" />
        <path d="M0 180 Q150 140 280 160 T400 130 L400 200 L0 200 Z" fill="#a8bdb0" />
      </svg>
      <div className="relative flex h-full items-center justify-center gap-6">
        <div className="w-28 rounded-xl border border-border bg-card p-3 shadow-md">
          <p className="text-[9px] font-bold text-primary">PDM</p>
          <div className="mt-1 h-10 rounded border border-border bg-surface" />
        </div>
        <div className="w-32 rounded-xl border border-border bg-card p-3 shadow-md">
          <p className="text-[9px] font-bold text-primary">S-Curve</p>
          <div className="mt-1 h-10 rounded bg-primary-light" />
        </div>
        <div className="w-28 rounded-xl border border-border bg-card p-3 shadow-md">
          <p className="text-[9px] font-bold text-primary">Report</p>
          <div className="mt-2 space-y-1">
            <div className="h-1 rounded bg-surface-muted" />
            <div className="h-1 rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
