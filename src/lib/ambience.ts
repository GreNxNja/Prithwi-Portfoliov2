import { getAnalyser } from '#/lib/audio'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'

/**
 * Publishes two numbers to the document as CSS custom properties, and lets the
 * stylesheet decide what to do with them:
 *
 *   --energy  0–1, how loud the instrument is right now
 *   --scroll  0–1, progress down the page
 *   --mx/--my 0–1, where the pointer is in the viewport
 *
 * The backdrop glow breathes on --energy, so the room genuinely lights up with
 * what you play rather than looping a canned animation. --scroll warms and
 * cools the same glow as you move between the human and machine halves, and
 * the spotlight follows --mx/--my.
 *
 * The pointer is only sampled here, never applied on the event — writing it in
 * the frame loop means a flood of pointermove events still costs one style
 * recalculation per frame, and the easing below keeps the light trailing the
 * cursor rather than snapping to it.
 */

/**
 * The eased scroll position, for the few readers that need the number itself
 * rather than the custom property. Kept at module scope so nothing has to call
 * getComputedStyle in a frame loop to read a value we already have in hand.
 */
let currentScroll = 0
let currentVelocity = 0

export const getScroll = () => currentScroll

/** Signed scroll velocity, roughly -1..1. Positive is downward. */
export const getVelocity = () => currentVelocity

export function startAmbience() {
  if (typeof window === 'undefined') return () => {}

  const root = document.documentElement
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let bins: Uint8Array | null = null
  let energy = 0
  let scroll = 0
  let velocity = 0
  let lastY = window.scrollY
  let mx = 0.5
  let my = 0.4
  let targetX = 0.5
  let targetY = 0.4

  // No cursor on a touch device, so there is nothing for the spotlight to
  // follow — skip the listener and the two custom properties entirely rather
  // than writing values every frame that never change. The CSS drops the
  // spotlight layer on the same query.
  const tracks = !isLowPower()

  const onMove = (e: PointerEvent) => {
    targetX = e.clientX / window.innerWidth
    targetY = e.clientY / window.innerHeight
  }
  if (tracks) window.addEventListener('pointermove', onMove, { passive: true })

  const stop = onFrame((dt) => {
    const analyser = getAnalyser()
    let target = 0

    if (analyser) {
      if (!bins || bins.length !== analyser.frequencyBinCount) {
        bins = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteTimeDomainData(bins as Uint8Array<ArrayBuffer>)
      // Peak deviation from the zero line, which tracks a plucked note's decay
      // far more musically than an average would.
      let peak = 0
      for (let i = 0; i < bins.length; i += 4) {
        const v = Math.abs(bins[i] - 128)
        if (v > peak) peak = v
      }
      target = Math.min(1, (peak / 128) * 2.6)
    }

    // Snap up on the attack, fall away slowly — the shape of a real note.
    const rate = target > energy ? 18 : 2.4
    energy += (target - energy) * Math.min(1, dt * rate)

    const max = document.body.scrollHeight - window.innerHeight
    const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    scroll += (next - scroll) * Math.min(1, dt * 6)
    currentScroll = scroll

    /*
     * How hard the page is being thrown, signed, roughly -1..1.
     *
     * Divided by dt so it's pixels per second rather than pixels per frame —
     * otherwise the same flick would read as twice the velocity on a 30Hz
     * display. Eased asymmetrically: it rises fast enough to catch a flick and
     * falls slowly, so effects hung off it decay instead of snapping off the
     * instant the scroll stops.
     */
    const px = window.scrollY - lastY
    lastY = window.scrollY
    const rawVel = dt > 0 ? Math.max(-1, Math.min(1, px / dt / 2600)) : 0
    velocity +=
      (rawVel - velocity) *
      Math.min(1, dt * (Math.abs(rawVel) > Math.abs(velocity) ? 14 : 4))
    currentVelocity = velocity

    root.style.setProperty(
      '--energy',
      (calm ? target * 0.3 : energy).toFixed(4),
    )
    root.style.setProperty('--scroll', scroll.toFixed(4))
    root.style.setProperty('--vel', velocity.toFixed(4))
    root.style.setProperty('--vel-abs', Math.abs(velocity).toFixed(4))

    if (!tracks) return
    // The spotlight still trails the hand — it's a wide, soft light and looking
    // glued to the cursor would read as cheap. But this is only the backdrop;
    // the cursor ring keeps its own, much faster position in CursorRing, so
    // nothing hard-edged is waiting on this easing.
    const lag = 1 - Math.exp(-7 * dt)
    mx += (targetX - mx) * lag
    my += (targetY - my) * lag
    root.style.setProperty('--mx', mx.toFixed(4))
    root.style.setProperty('--my', my.toFixed(4))
  })

  return () => {
    if (tracks) window.removeEventListener('pointermove', onMove)
    stop()
  }
}
