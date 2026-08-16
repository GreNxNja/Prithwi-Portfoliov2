import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Animates open on a measured height.
 *
 * The tidier `grid-template-rows: 0fr → 1fr` trick collapses to 0px here: the
 * inner element is `overflow: hidden`, which drops its automatic minimum size
 * to zero, so the fr track has no content size to resolve against. Measuring is
 * duller and always correct.
 */
export function Collapse({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => setHeight(el.scrollHeight)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [])

  return (
    <div
      className="overflow-hidden transition-[height,opacity] duration-500 ease-out"
      style={{ height: open ? height : 0, opacity: open ? 1 : 0 }}
      // Everything starts closed, so the server's height:0 matches the client.
      aria-hidden={!open}
      // aria-hidden alone would leave the links inside reachable by Tab —
      // announced to no one and scrolling an invisible panel into view. `inert`
      // takes them out of the focus order for as long as the panel is shut.
      inert={!open}
    >
      <div ref={inner}>{children}</div>
    </div>
  )
}
