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

    /*
     * The block's distance from the top of the document, cached. Calling
     * getBoundingClientRect in the frame loop forces a synchronous layout on
     * every single frame — the browser has to flush pending style and geometry
     * before it can answer — and doing that alongside everything else the loop
     * writes is what turns a smooth page into a stuttering one.
     *
     * Page position only changes when the layout does, so measure it on resize
     * instead and derive the rest from scrollY, which is free to read.
     */
    let top = 0
    const remeasure = () => {
      top = el.getBoundingClientRect().top + window.scrollY
    }

    let lastP = ''
    const measure = () => {
      // Fully lit by the time the block reaches the upper third, still dark
      // when it's below the fold. Reading position, not scroll position, so it
      // behaves the same on a tall monitor as on a short laptop.
      const viewportTop = top - window.scrollY
      const start = window.innerHeight * 0.92
      const end = window.innerHeight * 0.34
      const p = (start - viewportTop) / (start - end)
      const next = Math.max(0, Math.min(1, p)).toFixed(2)
      // Repainting text through a clipped gradient is not cheap; skip it
      // entirely on the frames where the value rounds to what it already was.
      if (next === lastP) return
      lastP = next
      el.style.setProperty('--p', next)
    }

    // Seed --p before switching the gradient on. Without this there is a
    // window — first paint, or any tab where the frame loop is throttled —
    // where the fallback of 0 renders the whole paragraph at 22% ink, which
    // looks like broken text rather than text waiting to be read.
    remeasure()
    measure()
    el.dataset.lit = 'true'

    const ro = new ResizeObserver(remeasure)
    ro.observe(document.body)

    const stop = onFrame(measure)
    return () => {
      ro.disconnect()
      stop()
    }
  }, [])

  return (
    <p ref={ref} className={`scroll-text ${className}`}>
      {children}
    </p>
  )
}
