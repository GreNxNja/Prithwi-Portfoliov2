import { useEffect, useState } from 'react'
import { isMuted, pluck, setMuted, wake } from '#/lib/audio'
import { TUNING, emitPluck } from '#/lib/tuning'

/** The six strings, folded down into a scroll indicator that still plays. */
export function Rail() {
  const [active, setActive] = useState(0)
  const [quiet, setQuiet] = useState(false)

  useEffect(() => {
    const sections = TUNING.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (!sections.length) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const i = TUNING.findIndex((s) => s.id === entry.target.id)
          if (i >= 0) setActive(i)
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    for (const el of sections) io.observe(el)
    return () => io.disconnect()
  }, [])

  const toggle = () => {
    wake()
    const next = !isMuted()
    setMuted(next)
    setQuiet(next)
    if (!next) pluck(TUNING[5].freq, { velocity: 0.4, position: 0.3 })
  }

  return (
    <>
      <nav
        aria-label="Sections"
        className="fixed top-1/2 left-4 z-40 hidden -translate-y-1/2 flex-col gap-4 lg:flex"
      >
        {TUNING.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            aria-label={s.label}
            aria-current={active === i ? 'true' : undefined}
            onClick={() => {
              wake()
              pluck(s.freq, { velocity: 0.45, position: 0.35 })
              emitPluck(i, { velocity: 0.45, position: 0.35 })
            }}
            className="group flex items-center gap-3"
          >
            <span
              className="block h-px transition-all duration-300"
              style={{
                width: active === i ? 32 : 16,
                background:
                  active === i ? 'var(--color-ember)' : 'var(--color-line)',
                boxShadow:
                  active === i ? '0 0 10px var(--color-ember)' : 'none',
              }}
            />
            <span
              className={`font-mono text-[0.6rem] tracking-[0.2em] uppercase transition-opacity duration-300 ${
                active === i
                  ? 'text-ember opacity-100'
                  : 'text-muted opacity-0 group-hover:opacity-70'
              }`}
            >
              {s.label}
            </span>
          </a>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={quiet}
        className="fixed top-5 right-[5vw] z-40 flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase transition-colors hover:text-ember"
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full transition-all"
          style={{
            background: quiet ? 'var(--color-line)' : 'var(--color-ember)',
            boxShadow: quiet ? 'none' : '0 0 8px var(--color-ember)',
          }}
        />
        {quiet ? 'muted' : 'live'}
      </button>
    </>
  )
}
