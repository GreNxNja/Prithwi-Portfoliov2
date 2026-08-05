import { useEffect, useRef } from 'react'
import { onFrame } from '#/lib/frame'
import { useInView } from '#/lib/useInView'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#*+=~'

/**
 * Resolves a label out of noise, one character at a time, when it scrolls in.
 * The mono voice on this page is the machine talking, so it decodes rather than
 * fades.
 *
 * The real string is always in the DOM for assistive tech; only the visual copy
 * is scrambled, so nobody's screen reader announces a line of garbage.
 */
export function Scramble({
  text,
  className,
  /** Milliseconds each character spends unresolved. */
  perChar = 55,
}: {
  text: string
  className?: string
  perChar?: number
}) {
  const [wrapRef, inView] = useInView<HTMLSpanElement>()
  const outRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = outRef.current
    if (!el || !inView) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = text
      return
    }

    let elapsed = 0
    const total = text.length * perChar + 260

    const stop = onFrame((dt) => {
      elapsed += dt * 1000
      let out = ''
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (ch === ' ') {
          out += ' '
          continue
        }
        // Each character settles a little after the one before it.
        if (elapsed > i * perChar + 260) out += ch
        else if (elapsed > i * perChar - 120)
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        else out += ' '
      }
      el.textContent = out
      if (elapsed >= total) {
        el.textContent = text
        stop()
      }
    })

    return stop
  }, [inView, text, perChar])

  return (
    <span ref={wrapRef} className={className}>
      <span className="sr-only">{text}</span>
      <span ref={outRef} aria-hidden>
        {text}
      </span>
    </span>
  )
}
