import { useEffect, useRef } from 'react'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'

/*
 * A critically damped spring, not a lerp.
 *
 * Exponential smoothing — x += (target - x) * k — has no velocity continuity.
 * It lunges the instant the target moves and decays from there, and once it is
 * fast enough to actually arrive, it arrives *between* pointer events and sits
 * still until the next one lands. Pointer events are discrete and unevenly
 * spaced, so that reads as a stutter: the mechanical feel. A slow lerp only
 * hides it by never catching up.
 *
 * A spring carries momentum across those gaps. It accelerates out of rest and
 * decelerates into place instead of stepping, and it is still moving when the
 * next event arrives, so there is nothing to restart.
 *
 * Damping is set to 2·sqrt(stiffness) — critical. Any less and the ring
 * overshoots and wobbles around the cursor, which looks worse than the stutter
 * it replaced.
 */
const STIFFNESS = 1250
const DAMPING = 2 * Math.sqrt(STIFFNESS)
/** Fixed substep. Explicit Euler on a spring this stiff goes unstable if it's
 *  handed a long frame, so integrate in slices regardless of frame length. */
const STEP = 1 / 240

export function CursorRing() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (isLowPower()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let x = 0
    let y = 0
    let vx = 0
    let vy = 0
    let tx = 0
    let ty = 0
    let seen = false
    let debt = 0
    let settled = false

    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (seen) return
      // Start on the cursor rather than sliding in from the corner.
      seen = true
      x = tx
      y = ty
      el.style.opacity = '1'
    }

    /*
     * pointerrawupdate fires at the pointer's own sampling rate instead of
     * being coalesced to one event per frame, so the spring is chasing a target
     * that is genuinely current. It's the difference between the ring following
     * the mouse and following a once-per-frame snapshot of it.
     */
    const raw = 'onpointerrawupdate' in window
    const event = raw ? 'pointerrawupdate' : 'pointermove'
    window.addEventListener(event, onMove as EventListener, { passive: true })

    const stop = onFrame((dt) => {
      if (!seen) return

      // A backgrounded tab hands back one enormous frame on return; cap it so
      // the ring resumes from where it was rather than catapulting.
      debt = Math.min(debt + dt, 0.1)

      while (debt >= STEP) {
        vx += ((tx - x) * STIFFNESS - vx * DAMPING) * STEP
        vy += ((ty - y) * STIFFNESS - vy * DAMPING) * STEP
        x += vx * STEP
        y += vy * STEP
        debt -= STEP
      }

      // Settled: no distance left to close and no speed left to shed. Writing
      // the same transform sixty times a second while the mouse sits still is
      // pure cost, so stop until it moves again.
      if (
        Math.abs(tx - x) < 0.05 &&
        Math.abs(ty - y) < 0.05 &&
        Math.hypot(vx, vy) < 1
      ) {
        x = tx
        y = ty
        vx = 0
        vy = 0
        if (settled) return
        settled = true
      } else {
        settled = false
      }

      // Position only. There was squash-and-stretch here, scaling the ring
      // along its direction of travel — on paper it makes a follower feel
      // alive, in practice a ring that is constantly an ellipse just reads as
      // a cursor that is broken. A circle that stays a circle is the whole
      // point of the shape.
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    })

    return () => {
      window.removeEventListener(event, onMove as EventListener)
      stop()
    }
  }, [])

  return <div ref={ref} className="cursor-ring" aria-hidden />
}
