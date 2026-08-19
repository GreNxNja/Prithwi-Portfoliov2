import { useEffect, useRef } from 'react'
import { getVelocity } from '#/lib/ambience'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'

/**
 * A band of enormous type running the full bleed of the page, counter to the
 * small marquee above it.
 *
 * Two strips moving opposite ways at different sizes is the cheapest way to
 * make a page feel like it has depth — the eye reads the disagreement as
 * distance. This one is set in the display serif at a size nothing else on the
 * page competes with, and outlined rather than filled so it reads as texture
 * behind the content rather than a headline shouting over it.
 */
export function Band({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const run = Array.from({ length: 6 }, () => text)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (isLowPower()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let offset = 0
    let half = track.scrollWidth / 2

    const ro = new ResizeObserver(() => {
      half = track.scrollWidth / 2
    })
    ro.observe(track)

    const stop = onFrame((dt) => {
      if (!half) return
      // Negative baseline and negative coupling: it drifts the other way, and
      // the scroll pushes it the other way too.
      offset -= (18 + getVelocity() * 620) * dt
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
      className={`marquee-mask overflow-hidden py-2 select-none ${className}`}
    >
      <div ref={trackRef} className="band">
        {run.map((item, i) => (
          <span key={i} className="band-word">
            {item}
            <span className="band-star">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
