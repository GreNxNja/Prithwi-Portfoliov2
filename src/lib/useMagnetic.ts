import { useEffect, useRef } from 'react'

/**
 * Nudges an element toward the cursor as it gets close, and lets go when it
 * leaves. Smoothing is a CSS transition on transform, so this only ever writes
 * one property and never runs a loop of its own.
 */
export function useMagnetic<T extends HTMLElement>(
  strength = 0.3,
  radius = 130,
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Coarse pointers have no hover to track, and this would only ever fire
    // mid-tap.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect()
      const dx = e.clientX - (box.left + box.width / 2)
      const dy = e.clientY - (box.top + box.height / 2)
      const near =
        Math.hypot(dx, dy) < radius + Math.max(box.width, box.height) / 2

      el.style.transform = near
        ? `translate3d(${(dx * strength).toFixed(2)}px, ${(dy * strength).toFixed(2)}px, 0)`
        : ''
    }

    const reset = () => {
      el.style.transform = ''
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', reset)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', reset)
    }
  }, [strength, radius])

  return ref
}
