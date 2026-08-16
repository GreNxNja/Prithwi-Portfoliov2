/**
 * Whether to draw the cheap version of an effect.
 *
 * Keyed on the pointer rather than the viewport: a narrow desktop window is
 * still a desktop GPU, and a large phone is still a phone. Everything gated on
 * this is decoration — the strings still ring, the scope still traces, they
 * just stop paying for glow passes a phone renders at a fraction of the frame
 * budget.
 *
 * Read lazily and cached, because a device does not grow a mouse mid-session.
 * Returns false on the server, so nothing here can desync SSR from hydration.
 */
let cached: boolean | null = null

export function isLowPower() {
  if (cached !== null) return cached
  if (typeof window === 'undefined') return false
  cached = window.matchMedia('(hover: none) and (pointer: coarse)').matches
  return cached
}
