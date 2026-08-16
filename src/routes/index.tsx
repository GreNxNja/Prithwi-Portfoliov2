import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Frame } from '#/components/Frame'
import { Instrument } from '#/components/Instrument'
import { Marquee } from '#/components/Marquee'
import { Pedalboard } from '#/components/Pedalboard'
import { Rail } from '#/components/Rail'
import { Resume } from '#/components/Resume'
import { Reveal } from '#/components/Reveal'
import { Scope } from '#/components/Scope'
import { Scramble } from '#/components/Scramble'
import { Setlist } from '#/components/Setlist'
import { Tour } from '#/components/Tour'
import { ABOUT, FACTS, ME, SIGNALS, TICKER } from '#/data/content'
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
      // `isolate` keeps the ghosted numeral's negative z-index inside this
      // section, so it sits under the heading but still over the backdrop.
      className="edge relative isolate scroll-mt-20 px-[5vw] py-20 sm:py-32 lg:pl-[9vw]"
    >
      <span aria-hidden className="numeral pointer-events-none select-none">
        {index}
      </span>

      <Reveal>
        <header className="flex items-baseline gap-3 sm:gap-4">
          <span className="font-mono text-xs text-ember tabular-nums">
            {index}
          </span>
          <h2 className="font-mono text-xs tracking-[0.22em] text-muted uppercase sm:tracking-[0.28em]">
            <Scramble text={title} />
          </h2>
          <span aria-hidden className="hairline flex-1" />
          <span
            aria-hidden
            className="font-mono text-[0.55rem] tracking-[0.25em] text-muted/40 uppercase"
          >
            {ME.handle}
          </span>
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
      <Frame />
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

        <div className="px-[5vw] pt-[3vh] sm:pt-[4vh] lg:pl-[9vw]">
          <h1 className="signature text-[clamp(3.2rem,12vw,9rem)]">
            <span className="rise">
              <span className="sheen" style={{ animationDelay: '150ms' }}>
                Prithwijit
              </span>
            </span>
            <span className="rise -mt-[0.16em] block pl-[0.06em]">
              <span
                className="bg-gradient-to-b from-muted to-muted/35 bg-clip-text text-transparent"
                style={{ animationDelay: '280ms' }}
              >
                Ghosh
              </span>
            </span>
          </h1>

          <p className="rise mt-5 max-w-md text-lg leading-snug text-ink/75 sm:mt-6 sm:text-2xl">
            <span style={{ animationDelay: '460ms' }}>
              Building sentient AI so I can enjoy my{' '}
              <span className="text-ember">guitar sessions</span> in peace.
            </span>
          </p>

          <div
            className="lift mt-6 flex flex-wrap items-center gap-5"
            style={{ animationDelay: '620ms' }}
          >
            <Resume />
            <a
              href="#setlist"
              className="wipe tap relative font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase hover:text-ember"
            >
              See the setlist
            </a>
          </div>
        </div>

        <div className="relative mt-[2vh] min-h-[max(30vh,210px)] flex-1">
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
      <Marquee items={TICKER} />

      {/* ---------------------------------------------------------------- */}
      <Section id="notes" index="01" title="Liner Notes">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-20">
          <div className="max-w-2xl space-y-7">
            {ABOUT.map((p, i) => (
              <Reveal key={i} delay={i * 110}>
                <p
                  className={
                    // The opening paragraph carries the section, so it speaks
                    // in the display serif — the same voice as the name.
                    i === 0
                      ? 'font-serif text-3xl leading-[1.15] text-ink sm:text-4xl'
                      : 'text-base leading-relaxed text-ink/70'
                  }
                >
                  {p}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={160}>
            {/* A spec plate: its own surface, so the facts read as stamped on
                something rather than floating in the page. */}
            <dl className="surface h-fit rounded-xl border border-line px-5 py-1 font-mono text-xs">
              {FACTS.map(([k, v], i) => (
                <div
                  key={k}
                  className={`group flex items-baseline justify-between gap-6 py-3.5 ${
                    i < FACTS.length - 1 ? 'border-b border-line/70' : ''
                  }`}
                >
                  <dt className="shrink-0 tracking-[0.15em] text-muted uppercase transition-colors duration-300 group-hover:text-ember">
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
          <p className="max-w-3xl font-serif text-4xl leading-[1.05] sm:text-6xl">
            Got something <em className="text-ember">worth</em> building?
          </p>
          <a
            ref={mailRef}
            href={`mailto:${ME.email}`}
            className="magnetic mt-8 inline-block font-mono text-base break-all text-ember hover:text-ink sm:text-2xl lg:text-3xl"
          >
            {ME.email}
          </a>

          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Resume />
            <span className="font-mono text-[0.6rem] tracking-[0.15em] text-muted/70 uppercase">
              or read the short version
            </span>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <ul className="mt-16 border-t border-line">
            {SIGNALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="row-sweep group flex items-baseline gap-4 border-b border-line py-5 sm:gap-8"
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
            className="magnetic quiet-btn surface rounded-full border border-line px-6 py-3 font-mono text-[0.7rem] tracking-[0.2em] text-muted uppercase hover:border-ember/60 hover:text-ember"
          >
            ♪ Strum all six
          </button>
        </div>

        <footer className="mt-24 border-t border-line pt-8">
          {/* The name once more on the way out, set huge and nearly gone. */}
          <span
            aria-hidden
            className="signature block bg-gradient-to-b from-ink/[0.07] to-transparent bg-clip-text text-[13vw] leading-[0.8] text-transparent select-none"
          >
            Prithwijit Ghosh
          </span>

          <div className="mt-6 flex flex-col gap-3 font-mono text-[0.65rem] tracking-wide text-muted sm:flex-row sm:items-center sm:justify-between">
            <span className="max-w-xl">
              Strings are simulated, not sampled — Karplus-Strong synthesis and
              the modal equation for a plucked string. No audio libraries.
            </span>
            <span className="shrink-0">
              © {new Date().getFullYear()} — {ME.location}
            </span>
          </div>
        </footer>
      </Section>
    </main>
  )
}
