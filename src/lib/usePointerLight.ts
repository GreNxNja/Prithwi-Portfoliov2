import { useEffect, useRef } from 'react'
import { onFrame } from '#/lib/frame'

/** Degrees of lean at the very edge of a panel. */
const TILT = 11

/**
 * Lights the panel under the cursor from the inside, and leans it toward them.
 *
 * One listener on the container, not one per card: the event is delegated, the
 * position is only *sampled* on move and written in the frame loop, and the
 * write goes to the single element the pointer is actually over. A board of
 * twenty pedals therefore costs one listener and one style write per frame,
 * not twenty of each.
 *
 * The tilt is published as --rx/--ry rather than written as a transform, so the
 * stylesheet stays in charge of composing it with the hover lift. Writing
 * transform from here would mean JS and Tailwind taking turns clobbering the
 * same property.
 *
 * `selector` picks out which descendants are lightable.
 */
export function usePointerLight<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let target: HTMLElement | null = null
    let previous: HTMLElement | null = null
    let x = 0
    let y = 0
    /** Fraction of the way across the panel, -0.5..0.5 from its centre. */
    let nx = 0
    let ny = 0
    let dirty = false

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest(selector)
      target = el instanceof HTMLElement ? el : null
      if (!target) return
      const box = target.getBoundingClientRect()
      x = e.clientX - box.left
      y = e.clientY - box.top
      nx = x / box.width - 0.5
      ny = y / box.height - 0.5
      dirty = true
    }

    root.addEventListener('pointermove', onMove, { passive: true })
    const stop = onFrame(() => {
      if (!dirty || !target) return
      dirty = false

      // Leaving a panel has to reset it, or the last tilt sticks and the board
      // ends up littered with cards frozen mid-lean.
      if (previous && previous !== target) {
        previous.style.removeProperty('--rx')
        previous.style.removeProperty('--ry')
      }
      previous = target

      target.style.setProperty('--px', `${x.toFixed(1)}px`)
      target.style.setProperty('--py', `${y.toFixed(1)}px`)
      // Inverted on X: pushing the cursor toward the top of a panel should tip
      // its top edge away, the way a real object pivots under a finger.
      target.style.setProperty('--rx', `${(-ny * TILT).toFixed(2)}deg`)
      target.style.setProperty('--ry', `${(nx * TILT).toFixed(2)}deg`)
    })

    const onLeave = () => {
      if (!previous) return
      previous.style.removeProperty('--rx')
      previous.style.removeProperty('--ry')
      previous = null
      target = null
    }
    root.addEventListener('pointerleave', onLeave)

    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      stop()
    }
  }, [selector])

  return ref
}
