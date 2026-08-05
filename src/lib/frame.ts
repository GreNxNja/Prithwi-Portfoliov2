/**
 * One requestAnimationFrame for the whole page.
 *
 * The instrument, the scope, the ambience and anything else that animates all
 * subscribe here, so there is exactly one rAF alive no matter how much is
 * moving — and it stops entirely when nothing is listening.
 */

type Tick = (dt: number, now: number) => void

const subscribers = new Set<Tick>()
let raf = 0
let last = 0

function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  for (const fn of subscribers) fn(dt, now)
  raf = requestAnimationFrame(loop)
}

export function onFrame(fn: Tick) {
  subscribers.add(fn)
  if (subscribers.size === 1 && typeof window !== 'undefined') {
    last = performance.now()
    raf = requestAnimationFrame(loop)
  }
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0) cancelAnimationFrame(raf)
  }
}
