import { useMemo, useState } from 'react'
import { Collapse } from '#/components/Collapse'
import { Harmonograph } from '#/components/Harmonograph'
import { SETLIST } from '#/data/content'
import { TUNING, emitPluck } from '#/lib/tuning'
import { pluck, strum, wake } from '#/lib/audio'

/** Deterministic pseudo-waveform, so each track keeps its own shape forever. */
function waveform(seed: string, n: number) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const out: Array<number> = []
  for (let i = 0; i < n; i++) {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    h |= 0
    const r = Math.abs(h % 1000) / 1000
    const envelope = Math.sin((i / (n - 1)) * Math.PI) ** 0.6
    // Rounded, and stored as a percentage: browsers normalise the precision of
    // an inline percentage, so full floats never survive hydration intact.
    out.push(Math.round((12 + r * 88 * envelope) * 100) / 100)
  }
  return out
}

export function Setlist() {
  const [open, setOpen] = useState<string | null>(null)
  const shapes = useMemo(
    () => Object.fromEntries(SETLIST.map((t) => [t.no, waveform(t.title, 48)])),
    [],
  )

  return (
    <ol className="border-t border-line">
      {SETLIST.map((track) => {
        const expanded = open === track.no
        const string = TUNING[track.string]

        return (
          <li key={track.no} className="border-b border-line">
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => {
                wake()
                setOpen(expanded ? null : track.no)
                if (!expanded) {
                  strum([string.freq, string.freq * 1.5, string.freq * 2], {
                    velocity: 0.45,
                    position: 0.3,
                    spread: 0.07,
                  })
                }
              }}
              onMouseEnter={() => {
                wake()
                pluck(string.freq, { velocity: 0.22, position: 0.55 })
                emitPluck(track.string, { velocity: 0.22, position: 0.55 })
              }}
              className="group grid w-full grid-cols-[2.5rem_1fr] items-center gap-x-4 gap-y-2 py-6 text-left transition-colors hover:bg-white/[0.02] sm:grid-cols-[3rem_minmax(0,1fr)_9rem_4rem] sm:gap-x-6"
            >
              <span className="self-start font-mono text-xs text-muted tabular-nums transition-colors group-hover:text-ember sm:self-center">
                {track.no}
              </span>

              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-display text-3xl leading-tight tracking-tight transition-colors group-hover:text-ember sm:text-4xl">
                    {track.title}
                  </span>
                  {track.award && (
                    <span className="rounded-full border border-ember/40 px-2.5 py-0.5 font-mono text-[0.6rem] tracking-[0.1em] text-ember uppercase">
                      ★ {track.award}
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-base text-muted">
                  {track.blurb}
                </span>
              </span>

              {/* The waveform, hand-drawn from a hash of the title. */}
              <span
                aria-hidden
                className="col-span-2 flex h-8 items-center gap-[2px] sm:col-span-1"
              >
                {shapes[track.no].map((v, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-full bg-line transition-all duration-500 group-hover:bg-ember/70"
                    style={{
                      height: `${v}%`,
                      transitionDelay: `${i * 6}ms`,
                    }}
                  />
                ))}
              </span>

              <span className="hidden text-right font-mono text-[0.65rem] tracking-widest text-muted uppercase sm:block">
                {track.when}
                <span className="mt-1 block text-ember/70">{string.note}</span>
              </span>
            </button>

            <Collapse open={expanded}>
              <div className="grid gap-8 pb-10 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-x-6">
                <div className="hidden sm:block" />
                <div className="max-w-2xl">
                  <p className="text-base leading-relaxed text-ink/80">
                    {track.detail}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2">
                    {track.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-line px-3 py-1 font-mono text-[0.65rem] tracking-wide text-muted transition-colors hover:border-ember/50 hover:text-ember"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  {track.repo && (
                    <a
                      href={track.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.15em] text-ember uppercase hover:underline hover:underline-offset-4"
                    >
                      Source <span aria-hidden>↗</span>
                    </a>
                  )}
                </div>

                {/* Its harmonograph — drawn from this track's own frequencies. */}
                <figure className="m-0 shrink-0 self-start">
                  <Harmonograph
                    seed={track.title}
                    active={expanded}
                    className="h-[190px] w-[190px] sm:h-[210px] sm:w-[210px]"
                  />
                  <figcaption className="mt-1 text-center font-mono text-[0.55rem] tracking-[0.15em] text-muted uppercase">
                    harmonograph · {string.note}
                  </figcaption>
                </figure>
              </div>
            </Collapse>
          </li>
        )
      })}
    </ol>
  )
}
