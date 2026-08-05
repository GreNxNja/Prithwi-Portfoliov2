import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Instrument } from '#/components/Instrument'
import { Pedalboard } from '#/components/Pedalboard'
import { Rail } from '#/components/Rail'
import { Reveal } from '#/components/Reveal'
import { Scope } from '#/components/Scope'
import { Scramble } from '#/components/Scramble'
import { Setlist } from '#/components/Setlist'
import { Tour } from '#/components/Tour'
import { ABOUT, FACTS, ME, SIGNALS } from '#/data/content'
import { startAmbience } from '#/lib/ambience'
import { strum, wake } from '#/lib/audio'
import { TUNING, emitPluck } from '#/lib/tuning'
import { useInView } from '#/lib/useInView'
import { useMagnetic } from '#/lib/useMagnetic'

export const Route = createFileRoute('/')({ component: Home })

function Section({
  id,
  index,
  title,
  lead,
  children,
}: {
  id: string
  index: string
  title: string
  lead?: string
  children: ReactNode
}) {
  const [ref, seen] = useInView<HTMLElement>()

  return (
    <section
      id={id}
      ref={ref}
      data-seen={seen ? 'true' : 'false'}
      className="edge scroll-mt-20 px-[5vw] py-20 sm:py-32 lg:pl-[9vw]"
    >
      <Reveal>
        <header className="flex items-baseline gap-3 sm:gap-4">
          <span className="font-mono text-xs text-ember tabular-nums">
            {index}
          </span>
          <h2 className="font-mono text-xs tracking-[0.22em] text-muted uppercase sm:tracking-[0.28em]">
            <Scramble text={title} />
          </h2>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </header>
        {lead && (
          <p className="mt-7 max-w-xl text-base text-muted sm:mt-8 sm:text-lg">
            {lead}
          </p>
        )}
      </Reveal>
      <div className="mt-10 sm:mt-12">{children}</div>
    </section>
  )
}

function Home() {
  // Publishes --energy and --scroll to the document; the stylesheet does the rest.
  useEffect(() => startAmbience(), [])

  const mailRef = useMagnetic<HTMLAnchorElement>(0.22, 150)
  const strumRef = useMagnetic<HTMLButtonElement>(0.35, 110)

  const openTuning = () => {
    wake()
    strum(
      TUNING.map((s) => s.freq),
      { velocity: 0.55, position: 0.3, spread: 0.09 },
    )
    TUNING.forEach((_, i) =>
      setTimeout(() => emitPluck(i, { velocity: 0.55, position: 0.3 }), i * 90),
    )
  }

  return (
    <main>
      <Rail />

      {/* ---------------------------------------------------------------- */}
      <section
        id="top"
        className="relative flex min-h-svh flex-col scroll-mt-0"
      >
        <header className="px-[5vw] pt-5">
          <span className="rise font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase">
            <span style={{ animationDelay: '80ms' }}>
              {ME.name} <span className="text-ember">/</span> {ME.location}
            </span>
          </span>
        </header>

        <div className="px-[5vw] pt-[6vh] sm:pt-[7vh] lg:pl-[9vw]">
          <h1 className="signature text-[clamp(3.2rem,13vw,9.5rem)]">
            <span className="rise">
              <span style={{ animationDelay: '150ms' }}>Prithwijit</span>
            </span>
            <span className="rise -mt-[0.12em] block pl-[0.12em]">
              <span className="text-muted" style={{ animationDelay: '280ms' }}>
                Ghosh
              </span>
            </span>
          </h1>
          <p className="rise mt-6 max-w-md text-lg leading-snug text-ink/75 sm:mt-7 sm:text-2xl">
            <span style={{ animationDelay: '460ms' }}>
              Building sentient AI so I can enjoy my{' '}
              <span className="text-ember">guitar sessions</span> in peace.
            </span>
          </p>
        </div>

        <div className="relative mt-[4vh] min-h-[max(42vh,260px)] flex-1">
          {/* The surname again, enormous and ghosted, for the strings to cross. */}
          <span
            aria-hidden
            className="ghost signature pointer-events-none absolute inset-x-[5vw] top-1/2 text-center text-[26vw] select-none"
          >
            Ghosh
          </span>
          <Instrument />
        </div>

        <div className="px-[5vw] pb-7 lg:pl-[9vw]">
          <Scope height={54} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <Section id="notes" index="01" title="Liner Notes">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-20">
          <div className="max-w-2xl space-y-7">
            {ABOUT.map((p, i) => (
              <Reveal key={i} delay={i * 110}>
                <p
                  className={
                    i === 0
                      ? 'text-2xl leading-snug text-ink sm:text-3xl'
                      : 'text-base leading-relaxed text-ink/70'
                  }
                >
                  {p}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={160}>
            <dl className="h-fit border-t border-line font-mono text-xs">
              {FACTS.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3.5"
                >
                  <dt className="shrink-0 tracking-[0.15em] text-muted uppercase">
                    {k}
                  </dt>
                  <dd className="text-right text-ink/80">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="setlist"
        index="02"
        title="Setlist"
        lead="Four things I built, each tuned to one of the strings above. Hover to hear it. Click for the liner notes."
      >
        <Setlist />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="tour"
        index="03"
        title="Tour Dates"
        lead="Where the work has actually shipped."
      >
        <Tour />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section
        id="rig"
        index="04"
        title="The Rig"
        lead="Signal chain, input to amp. The lit ones are what I reach for first."
      >
        <Pedalboard />
      </Section>

      {/* ---------------------------------------------------------------- */}
      <Section id="encore" index="05" title="Encore">
        <Reveal>
          <p className="max-w-3xl font-display text-3xl leading-tight font-medium tracking-tight sm:text-5xl">
            Got something worth building?
          </p>
          <a
            ref={mailRef}
            href={`mailto:${ME.email}`}
            className="magnetic mt-8 inline-block font-mono text-base break-all text-ember hover:text-ink sm:text-2xl lg:text-3xl"
          >
            {ME.email}
          </a>
        </Reveal>

        <Reveal delay={100}>
          <ul className="mt-16 border-t border-line">
            {SIGNALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-baseline gap-4 border-b border-line py-5 transition-colors hover:bg-white/[0.02] sm:gap-8"
                >
                  <span className="w-8 font-mono text-[0.6rem] tracking-widest text-muted transition-colors group-hover:text-signal">
                    {s.band}
                  </span>
                  <span className="min-w-0 flex-1 font-display text-2xl font-medium tracking-tight transition-colors group-hover:text-ember sm:text-3xl">
                    {s.label}
                  </span>
                  <span className="hidden truncate font-mono text-xs text-muted sm:block">
                    {s.where}
                  </span>
                  <span
                    aria-hidden
                    className="font-mono text-sm text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ember"
                  >
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-14">
          <button
            ref={strumRef}
            type="button"
            onClick={openTuning}
            className="magnetic rounded-full border border-line px-6 py-3 font-mono text-[0.7rem] tracking-[0.2em] text-muted uppercase hover:border-ember/60 hover:text-ember"
          >
            ♪ Strum all six
          </button>
        </div>

        <footer className="mt-24 flex flex-col gap-3 border-t border-line pt-8 font-mono text-[0.65rem] tracking-wide text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="max-w-xl">
            Strings are simulated, not sampled — Karplus-Strong synthesis and
            the modal equation for a plucked string. No audio libraries.
          </span>
          <span className="shrink-0">
            © {new Date().getFullYear()} — {ME.location}
          </span>
        </footer>
      </Section>
    </main>
  )
}
