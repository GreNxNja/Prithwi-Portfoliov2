import type { ReactNode } from 'react'
import { useInView } from '#/lib/useInView'

/**
 * Fades and lifts its children the first time they scroll into view.
 *
 * The hidden state lives in CSS behind `@media (scripting: enabled)` rather
 * than in inline styles, so a browser that can't run the script leaves the text
 * visible instead of stranded. See `[data-reveal]` in styles.css.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  /** Milliseconds, for staggering siblings. */
  delay?: number
  className?: string
}) {
  const [ref, inView] = useInView<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={className}
      data-reveal
      data-in={inView ? 'true' : 'false'}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
