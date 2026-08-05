import { useEffect, useRef, useState } from 'react'

/**
 * True once the element has scrolled into view, and stays true.
 *
 * Anything already on screen at mount resolves synchronously: it avoids a
 * pointless animation for content the visitor is already looking at, and means
 * nothing is ever left waiting on an observer callback that never comes.
 */
export function useInView<T extends HTMLElement>(margin = '0px 0px -10% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const box = el.getBoundingClientRect()
    if (box.top < window.innerHeight && box.bottom > 0) {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: margin, threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [margin])

  return [ref, inView] as const
}
