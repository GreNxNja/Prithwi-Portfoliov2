import { RIG } from '#/data/content'
import { pluck, wake } from '#/lib/audio'
import { usePointerLight } from '#/lib/usePointerLight'

/** Semitones above a low E, so hovering the board is at least in key. */
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17]
const note = (i: number) => 82.41 * 2 ** (SCALE[i % SCALE.length] / 12) * 2

export function Pedalboard() {
  // One listener for the whole board; each enclosure lights from within.
  const boardRef = usePointerLight<HTMLDivElement>('[data-pedal]')

  return (
    <div ref={boardRef} className="space-y-10">
      {RIG.map((row, r) => (
        <div
          key={row.row}
          className="grid gap-4 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6"
        >
          <div className="flex items-center gap-3 sm:block">
            <span className="font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase">
              {row.row}
            </span>
            <span
              aria-hidden
              className="h-px flex-1 bg-line sm:mt-3 sm:block sm:w-8"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {row.pedals.map((pedal, i) => (
              <button
                key={pedal.name}
                type="button"
                data-pedal
                onMouseEnter={() => {
                  wake()
                  pluck(note(r * 3 + i), { velocity: 0.18, position: 0.35 })
                }}
                onFocus={() => {
                  wake()
                  pluck(note(r * 3 + i), { velocity: 0.18, position: 0.35 })
                }}
                className="group surface surface-light tilt relative isolate w-[9.5rem] overflow-hidden rounded-xl border border-line bg-surface px-4 pt-4 pb-3 text-left hover:border-ember/50 hover:shadow-[0_18px_44px_-16px_var(--color-ember)] focus-visible:border-ember/50 focus-visible:outline-none"
              >
                {/* A sheen across the enclosure, the way light catches an
                    anodised box when you lean over the board. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />

                {/* The LED. */}
                <span
                  aria-hidden
                  className={`absolute top-3 right-3 h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                    pedal.hot
                      ? 'pulse bg-ember'
                      : 'bg-line group-hover:bg-ember group-hover:shadow-[0_0_8px_var(--color-ember)]'
                  }`}
                />
                {/* The knob. */}
                <span
                  aria-hidden
                  className="mb-3 block h-6 w-6 rounded-full border border-line bg-void transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[135deg] group-focus-visible:rotate-[135deg]"
                >
                  <span className="mx-auto block h-2.5 w-px bg-muted" />
                </span>
                <span className="block text-sm font-medium tracking-tight">
                  {pedal.name}
                </span>
                <span className="mt-0.5 block font-mono text-[0.6rem] tracking-wide text-muted">
                  {pedal.note}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
