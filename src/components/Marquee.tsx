import { useEffect, useRef } from 'react'
import { getVelocity } from '#/lib/ambience'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'

/**
 * The venue marquee — a strip of running text between movements.
 *
 * It isn't a CSS animation, because it reacts to the page: the strip has a
 * lazy baseline drift, and throwing the page adds the scroll's own velocity to
 * it, so a hard flick downward rips the text along and a flick back drags it
 * the other way. That coupling is the whole point — it makes the strip feel
 * like it's mounted to the page rather than looping beside it.
 *
 * The list is rendered twice and the offset wraps at half the track width, so
 * the seam always lands where the copy repeats.
 *
 * Phones and reduced-motion keep a plain CSS loop (or nothing), since this is
 * a per-frame transform write on a wide element.
 */
export function Marquee({
  items,
  className = '',
}: {
  items: Array<string>
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const run = [...items, ...items]

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (isLowPower()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Opt out of the CSS fallback loop; this drives the transform now.
    track.style.animation = 'none'

    let offset = 0
    let half = track.scrollWidth / 2

    const ro = new ResizeObserver(() => {
      half = track.scrollWidth / 2
    })
    ro.observe(track)

    const stop = onFrame((dt) => {
      if (!half) return
      // Baseline drift plus whatever the page is doing, scaled up so a flick
      // is unmistakable.
      offset += (34 + getVelocity() * 900) * dt
      // Wrap into [0, half) in one step, so a big velocity spike can't walk the
      // offset far outside the range and pop.
      offset = ((offset % half) + half) % half
      track.style.transform = `translate3d(${-offset}px, 0, 0)`
    })

    return () => {
      stop()
      ro.disconnect()
    }
  }, [])

  return (
    <div
      aria-hidden
      className={`marquee-mask overflow-hidden border-y border-line py-3.5 ${className}`}
    >
      <div ref={trackRef} className="marquee">
        {run.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-8 pr-8 font-mono text-[0.7rem] tracking-[0.28em] whitespace-nowrap text-muted uppercase"
          >
            {item}
            <span className="inline-block h-1 w-1 rotate-45 bg-ember/50" />
          </span>
        ))}
      </div>
    </div>
  )
}
