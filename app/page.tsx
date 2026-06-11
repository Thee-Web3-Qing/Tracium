import { Brain, Calendar, Shield, Users, Rocket, AlertTriangle, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

const SlackIcon = () => (
  <svg viewBox="0 0 127 127" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80z" fill="#E01E5A"/>
    <path d="M33.6 80c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A"/>
    <path d="M46.8 27c-7.3 0-13.2-5.9-13.2-13.2C33.6 6.5 39.5.6 46.8.6c7.3 0 13.2 5.9 13.2 13.2V27H46.8z" fill="#36C5F0"/>
    <path d="M46.8 33.4c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.8C6.5 59.8.6 53.9.6 46.6c0-7.3 5.9-13.2 13.2-13.2h33z" fill="#36C5F0"/>
    <path d="M99.8 46.6c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.8V46.6z" fill="#2EB67D"/>
    <path d="M93.4 46.6c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v32.8z" fill="#2EB67D"/>
    <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2z" fill="#ECB22E"/>
    <path d="M80.1 93.4c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h32.9c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E"/>
  </svg>
);

const memoryTypes = [
  {
    icon: CheckCircle2,
    label: 'Decisions',
    example: '"We decided to migrate to the new auth system by end of month."',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/20',
  },
  {
    icon: Users,
    label: 'Ownership',
    example: '"Sarah owns the onboarding redesign."',
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    border: 'border-sky-400/20',
  },
  {
    icon: Calendar,
    label: 'Deadlines',
    example: '"The API needs to be ready before Wednesday."',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
  },
  {
    icon: AlertTriangle,
    label: 'Blockers',
    example: '"We can\'t ship until design signs off on the flow."',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/20',
  },
  {
    icon: Rocket,
    label: 'Launch Decisions',
    example: '"Agreed to delay launch — onboarding not validated yet."',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
  },
  {
    icon: Brain,
    label: 'Action Items',
    example: '"Marcus to set up the staging environment by Friday."',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white antialiased">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight text-white">Tracium</span>
          <a
            href="#"
            className="flex items-center gap-2 bg-white text-zinc-900 text-sm font-medium px-4 py-1.5 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <SlackIcon />
            Add to Slack
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-14 overflow-hidden">

        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900 text-zinc-400 text-xs px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Slack Agent for Organizations
          </div>

          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-none text-white mb-2">
            Your Chief Of Operations
          </h1>
          <p className="text-xs text-zinc-500 tracking-widest uppercase mb-6">
            in training
          </p>

          <p className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed">
            Tracium watches your Slack conversations and remembers everything your
            team decides, owns, and owes — then recalls it the moment anyone asks.
          </p>

          <a
            href="#"
            className="group flex items-center gap-3 bg-white text-zinc-900 font-semibold text-base px-7 py-3.5 rounded-full hover:bg-zinc-100 transition-all shadow-lg shadow-white/10"
          >
            <SlackIcon />
            Add Tracium to your Slack
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <p className="mt-4 text-xs text-zinc-600">
            Free during hackathon period · No credit card required
          </p>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-600">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-zinc-600 to-transparent" />
        </div>
      </section>

      {/* ── Live Demo ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs text-zinc-500 uppercase tracking-widest mb-12">
            Ask it anything
          </p>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl shadow-black/40">
            {/* Channel header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800 bg-zinc-900/80">
              <span className="text-zinc-500 text-sm">#</span>
              <span className="text-zinc-300 text-sm font-medium">product</span>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-5">
              {/* User message */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                  JT
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">James T.</span>
                    <span className="text-xs text-zinc-600">Today at 10:14 AM</span>
                  </div>
                  <p className="text-sm text-zinc-300">
                    <span className="text-violet-400 font-medium">@Tracium</span> why did we delay the launch?
                  </p>
                </div>
              </div>

              {/* Tracium reply */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">Tracium</span>
                    <span className="text-xs text-zinc-600">Today at 10:14 AM</span>
                    <span className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">APP</span>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed max-w-lg">
                    On June 11 the team agreed to delay the launch because onboarding issues
                    had not been validated with users. The decision was discussed in{' '}
                    <span className="text-violet-400">#product</span> and ownership was
                    assigned to Sarah. There is also an open blocker on design sign-off recorded
                    the same day in{' '}
                    <span className="text-violet-400">#design</span>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What Tracium Stores ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Memory</p>
            <h2 className="text-3xl font-bold text-white">
              Six things your team keeps forgetting
            </h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto">
              Tracium passively extracts these from every conversation — no tagging, no forms, no behavior change.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memoryTypes.map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border ${item.border} ${item.bg} p-5 flex flex-col gap-3`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className={`text-sm font-semibold ${item.color}`}>{item.label}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed italic">{item.example}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl font-bold text-white">Three steps. Zero effort.</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Add to Slack',
                body: 'Install Tracium and invite it to the channels you want it to watch. That\'s it — no onboarding, no training.',
                icon: SlackIcon,
              },
              {
                step: '02',
                title: 'It listens',
                body: 'Every message is quietly analyzed. Decisions, deadlines, blockers, ownership — stored automatically as your team talks.',
                icon: () => <Clock className="w-5 h-5 text-zinc-400" />,
              },
              {
                step: '03',
                title: 'Ask anything',
                body: 'Mention @Tracium with any question. Get a factual answer with dates, channels, and owners — or an honest "I don\'t have a record of that."',
                icon: () => <Brain className="w-5 h-5 text-zinc-400" />,
              },
            ].map(({ step, title, body, icon: Icon }) => (
              <div key={step} className="relative rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <span className="absolute top-4 right-4 text-3xl font-black text-zinc-800 select-none">
                  {step}
                </span>
                <div className="mb-4">
                  <Icon />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Risk Detection ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-rose-400" />
              </div>
            </div>
            <div>
              <span className="text-xs text-rose-400 uppercase tracking-widest font-medium">Also included</span>
              <h3 className="text-xl font-bold text-white mt-2 mb-3">Risk detection</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                When a genuine business risk appears in conversation — skipping a security
                review, shipping without a rollback plan, bypassing validation — Tracium
                speaks up directly in the thread. Not a report. A senior operator's gut reaction.
              </p>
              <div className="mt-4 p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-400 font-mono">
                "Hey, before we go down this path — shipping without a rollback plan
                has burned us before. Can we get a feature flag in place first?"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-3">
            Your team&apos;s memory starts today.
          </h2>
          <p className="text-zinc-500 mb-10">
            Every conversation from here on is captured. Every decision, every owner, every deadline.
          </p>
          <a
            href="#"
            className="group inline-flex items-center gap-3 bg-white text-zinc-900 font-semibold text-base px-8 py-4 rounded-full hover:bg-zinc-100 transition-all shadow-xl shadow-white/10"
          >
            <SlackIcon />
            Add Tracium to your Slack
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <p className="mt-4 text-xs text-zinc-700">
            Free during hackathon period · No credit card required
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-white tracking-tight">Tracium</span>
          <p className="text-xs text-zinc-600">
            Your Chief Of Operations.{' '}
            <span className="text-zinc-700">in training.</span>
          </p>
          <a
            href="https://github.com/Thee-Web3-Qing/Tracium"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1"
          >
            View on GitHub
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
