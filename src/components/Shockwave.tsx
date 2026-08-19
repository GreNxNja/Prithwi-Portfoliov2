import { useEffect, useRef } from 'react'
import { isLowPower } from '#/lib/device'
import { onPluck } from '#/lib/tuning'

/** Rings alive at once. Beyond this a fast strum is just a white smear. */
const POOL = 3
/** Below this velocity a pluck is a brush, not a hit. */
const THRESHOLD = 0.3

/**
 * A ring that rips outward across the whole page when a string is struck hard.
 *
 * The site's one real interaction is hitting a string, and until now the
 * response stopped at the edge of the canvas. This carries it out over
 * everything — the room reacting to the note, not just the instrument.
 *
 * Three pooled elements, reused round-robin: retriggering is a matter of
 * removing the class, forcing a reflow, and adding it back, which is the one
 * reliable way to restart a CSS animation mid-flight. No elements are created
 * or destroyed while playing.
 */
export function Shockwave() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (isLowPower()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rings = Array.from(host.children) as Array<HTMLElement>
    let next = 0

    return onPluck((_i, ev) => {
      if (ev.velocity < THRESHOLD) return

      // Centre it on the strings if they're on screen, so the ring leaves the
      // instrument rather than the middle of whatever you happen to be reading.
      const canvas = document.querySelector('canvas')
      const box = canvas?.getBoundingClientRect()
      const onScreen = box && box.bottom > 0 && box.top < window.innerHeight
      const cx = onScreen ? box.left + box.width * 0.35 : window.innerWidth / 2
      const cy = onScreen ? box.top + box.height / 2 : window.innerHeight / 2

      const ring = rings[next]
      next = (next + 1) % POOL

      ring.style.left = `${cx}px`
      ring.style.top = `${cy}px`
      ring.style.setProperty('--hit', ev.velocity.toFixed(3))
      ring.classList.remove('shock-go')
      // Reading offsetWidth flushes the style change, so the animation restarts
      // from frame zero instead of being treated as unchanged.
      void ring.offsetWidth
      ring.classList.add('shock-go')
    })
  }, [])

  return (
    <div ref={hostRef} aria-hidden>
      {Array.from({ length: POOL }, (_, i) => (
        <span key={i} className="shock" />
      ))}
    </div>
  )
}
