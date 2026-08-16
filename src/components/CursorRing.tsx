import { useEffect, useRef } from 'react'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'

/**
 * The ring that follows the cursor.
 *
 * It deliberately does *not* read the --mx/--my the spotlight uses. Those are
 * eased slowly on purpose — a wide, soft light trailing well behind the hand
 * looks intentional, while a hard-edged ring doing the same just looks broken.
 * This keeps its own position and closes most of the gap within a few frames.
 *
 * The transform is written straight to this one element rather than through an
 * inherited custom property on :root, which is also the cheaper of the two:
 * a registered inheriting property changing every frame invalidates style for
 * the whole document, where this touches exactly one node.
 */
export function CursorRing() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (isLowPower()) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let tx = x
    let ty = y
    let seen = false

    const onMove = (e: PointerEvent) => {
      tx = e.clientX
      ty = e.clientY
      if (seen) return
      // Jump to the pointer the first time rather than sliding in from the
      // middle of the screen.
      seen = true
      x = tx
      y = ty
      el.style.opacity = '1'
    }

    window.addEventListener('pointermove', onMove, { passive: true })

    const stop = onFrame((dt) => {
      if (!seen) return
      // Frame-rate independent: an exponential approach, so the ring covers the
      // same fraction of the gap per second whether the display runs at 60Hz or
      // 144Hz. min(1, dt * rate) would make it stiffer on a fast display.
      const k = 1 - Math.exp(-34 * dt)
      x += (tx - x) * k
      y += (ty - y) * k
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`
    })

    return () => {
      window.removeEventListener('pointermove', onMove)
      stop()
    }
  }, [])

  return <div ref={ref} className="cursor-ring" aria-hidden />
}
