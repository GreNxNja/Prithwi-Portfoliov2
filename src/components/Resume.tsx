import { RESUME } from '#/data/content'
import { pluck, wake } from '#/lib/audio'

/**
 * The résumé download. Deliberately quiet — a hairline ring in the mono voice,
 * the same register as the mute toggle and the strum button, so it reads as
 * furniture rather than a call to action. The fill rises from the bottom edge
 * on approach (.quiet-btn), and the arrow drops a few pixels.
 *
 * `download` asks the browser to save rather than navigate; the filename comes
 * from the attribute so what lands in Downloads is named properly.
 */
export function Resume({ className = '' }: { className?: string }) {
  return (
    <a
      href={RESUME.href}
      download={RESUME.filename}
      onPointerEnter={() => {
        wake()
        // A low, short note — the sound of reaching for something.
        pluck(110, { velocity: 0.16, position: 0.4 })
      }}
      className={`quiet-btn surface inline-flex items-center gap-2.5 rounded-full border border-line px-5 py-2.5 font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase hover:border-ember/50 hover:text-ember focus-visible:border-ember/50 ${className}`}
    >
      <span aria-hidden className="drop">
        ↓
      </span>
      Résumé
      <span aria-hidden className="text-[0.55rem] text-muted/60">
        PDF
      </span>
    </a>
  )
}
