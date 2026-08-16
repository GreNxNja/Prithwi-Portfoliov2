import { useEffect, useRef } from 'react'
import { ME } from '#/data/content'
import { getScroll } from '#/lib/ambience'
import { onFrame } from '#/lib/frame'

/**
 * The window the page is seen through: four corner ticks and two edge labels,
 * fixed over everything and inert to the pointer.
 *
 * It's the oldest trick in art direction — draw a frame and whatever is inside
 * it reads as composed rather than merely placed. The ticks are drawn as
 * borders on empty spans, so the whole thing is four elements and no images.
 */
export function Frame() {
  const pct = useRef<HTMLSpanElement>(null)

  // The readout is written straight to the text node rather than through
  // state: it changes on almost every frame of a scroll, and re-rendering
  // React 100 times down the page to move two digits would be absurd.
  useEffect(() => {
    let last = -1
    return onFrame(() => {
      const next = Math.round(getScroll() * 100)
      if (next === last || !pct.current) return
      last = next
      pct.current.textContent = String(next).padStart(2, '0')
    })
  }, [])

  const tick = 'pointer-events-none fixed z-30 h-3.5 w-3.5 border-line'

  return (
    <div aria-hidden>
      <span className={`${tick} top-3.5 left-3.5 border-t border-l`} />
      <span className={`${tick} top-3.5 right-3.5 border-t border-r`} />
      <span className={`${tick} bottom-3.5 left-3.5 border-b border-l`} />
      <span className={`${tick} right-3.5 bottom-3.5 border-r border-b`} />

      {/* Both labels read bottom-to-top, the way a spine does. */}
      {/* vertical-rl reads top-to-bottom; the 180 turn flips it to read up the
          page like a book spine. Rotating about the centre keeps the box where
          it was laid out — an offset origin walks it off the edge. */}
      <span className="pointer-events-none fixed bottom-12 left-3 z-30 hidden rotate-180 font-mono text-[0.55rem] tracking-[0.3em] text-muted/50 uppercase [writing-mode:vertical-rl] xl:block">
        {ME.name} — Portfolio
      </span>

      <span className="pointer-events-none fixed right-3 bottom-12 z-30 hidden items-center gap-2 font-mono text-[0.55rem] tracking-[0.3em] text-muted/50 tabular-nums [writing-mode:vertical-rl] xl:flex">
        <span ref={pct}>00</span>
        <span className="text-muted/30">%</span>
      </span>
    </div>
  )
}
