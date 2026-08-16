import { useEffect, useRef } from 'react'
import { onFrame } from '#/lib/frame'

/**
 * Lights the panel under the cursor from the inside.
 *
 * One listener on the container, not one per card: the event is delegated, the
 * position is only *sampled* on move and written in the frame loop, and the
 * write goes to the single element the pointer is actually over. A board of
 * twenty pedals therefore costs one listener and one style write per frame,
 * not twenty of each.
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
    let x = 0
    let y = 0
    let dirty = false

    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest(selector)
      target = el instanceof HTMLElement ? el : null
      if (!target) return
      const box = target.getBoundingClientRect()
      x = e.clientX - box.left
      y = e.clientY - box.top
      dirty = true
    }

    root.addEventListener('pointermove', onMove, { passive: true })
    const stop = onFrame(() => {
      if (!dirty || !target) return
      dirty = false
      target.style.setProperty('--px', `${x.toFixed(1)}px`)
      target.style.setProperty('--py', `${y.toFixed(1)}px`)
    })

    return () => {
      root.removeEventListener('pointermove', onMove)
      stop()
    }
  }, [selector])

  return ref
}
