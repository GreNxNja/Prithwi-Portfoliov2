import { RIG } from '#/data/content'
import { pluck, wake } from '#/lib/audio'

/** Semitones above a low E, so hovering the board is at least in key. */
const SCALE = [0, 3, 5, 7, 10, 12, 15, 17]
const note = (i: number) => 82.41 * 2 ** (SCALE[i % SCALE.length] / 12) * 2

export function Pedalboard() {
  return (
    <div className="space-y-10">
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
                onMouseEnter={() => {
                  wake()
                  pluck(note(r * 3 + i), { velocity: 0.18, position: 0.35 })
                }}
                onFocus={() => {
                  wake()
                  pluck(note(r * 3 + i), { velocity: 0.18, position: 0.35 })
                }}
                className="group relative w-[9.5rem] rounded-lg border border-line bg-surface px-4 pt-4 pb-3 text-left transition-all duration-200 hover:-translate-y-1 hover:border-ember/50 focus-visible:-translate-y-1 focus-visible:border-ember/50 focus-visible:outline-none"
              >
                {/* The LED. */}
                <span
                  aria-hidden
                  className={`absolute top-3 right-3 h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                    pedal.hot
                      ? 'bg-ember shadow-[0_0_8px_var(--color-ember)]'
                      : 'bg-line group-hover:bg-ember group-hover:shadow-[0_0_8px_var(--color-ember)]'
                  }`}
                />
                {/* The knob. */}
                <span
                  aria-hidden
                  className="mb-3 block h-6 w-6 rounded-full border border-line bg-void transition-transform duration-300 group-hover:rotate-[135deg] group-focus-visible:rotate-[135deg]"
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
