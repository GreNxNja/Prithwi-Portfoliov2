import { useEffect, useRef } from 'react'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'

/**
 * Text that lights up as it travels up the screen.
 *
 * The paragraph is painted through a gradient clipped to the glyphs, and the
 * position of that gradient is driven by where the block sits in the viewport
 * — so the copy resolves out of the dark as you read toward it, rather than
 * arriving all at once the way a fade does.
 *
 * It's one custom property write per frame for one element, and the gradient
 * does the rest in the compositor. The obvious alternative — splitting into
 * per-word spans and animating each — costs a span per word and a style write
 * per span, for an effect that reads the same.
 *
 * Falls back to plain ink on phones and under reduced motion, where the
 * gradient never moves and would otherwise leave half the paragraph dim.
 */
export function ScrollText({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (isLowPower()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const measure = () => {
      const box = el.getBoundingClientRect()
      // Fully lit by the time the block reaches the upper third, still dark
      // when it's below the fold. Reading position, not scroll position, so it
      // behaves the same on a tall monitor as on a short laptop.
      const start = window.innerHeight * 0.92
      const end = window.innerHeight * 0.34
      const p = (start - box.top) / (start - end)
      el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3))
    }

    // Seed --p before switching the gradient on. Without this there is a
    // window — first paint, or any tab where the frame loop is throttled —
    // where the fallback of 0 renders the whole paragraph at 22% ink, which
    // looks like broken text rather than text waiting to be read.
    measure()
    el.dataset.lit = 'true'

    return onFrame(measure)
  }, [])

  return (
    <p ref={ref} className={`scroll-text ${className}`}>
      {children}
    </p>
  )
}
