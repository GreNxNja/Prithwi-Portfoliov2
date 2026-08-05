import { useEffect, useRef } from 'react'
import { onFrame } from '#/lib/frame'

/**
 * A harmonograph: the figure two pairs of coupled pendulums trace as they swing
 * and die away.
 *
 *   x(t) = Σ aᵢ·sin(fᵢt + φᵢ)·e^(−dᵢt)
 *   y(t) = Σ bᵢ·sin(gᵢt + ψᵢ)·e^(−dᵢt)
 *
 * Every project gets its own, seeded from its title and tuned to the string it
 * sits on — the pendulum frequencies are just-intonation ratios of that note,
 * so the curves close on themselves instead of smearing. Real Victorian drawing
 * machines worked exactly this way, which makes it the one kind of generative
 * art that actually belongs on a page about strings.
 */

const RATIOS = [1, 2, 3, 4, 3 / 2, 4 / 3, 5 / 4, 5 / 3, 5 / 2]

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Small deterministic PRNG, so a title always draws the same figure. */
function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Pendulum = { amp: number; freq: number; phase: number; decay: number }

export function Harmonograph({
  seed,
  active,
  className,
}: {
  seed: string
  /** Only draws once the panel it lives in is actually open. */
  active: boolean
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !active) return
    const c = canvas.getContext('2d')
    if (!c) return

    const rnd = mulberry32(hash(seed))
    const pendulum = (): Pendulum => ({
      amp: 0.28 + rnd() * 0.24,
      // A ratio, nudged a hair off true — the detune is what opens the closed
      // curve into a drifting ribbon instead of a single flat loop.
      freq: RATIOS[Math.floor(rnd() * RATIOS.length)] + (rnd() - 0.5) * 0.012,
      phase: rnd() * Math.PI * 2,
      decay: 0.004 + rnd() * 0.011,
    })
    const px = [pendulum(), pendulum()]
    const py = [pendulum(), pendulum()]

    const STEP = 0.018
    const LIMIT = 62
    const PER_FRAME = 320
    const PAD = 12

    // Trace the whole figure up front in unit space. Amplitudes are random, so
    // the natural extent of a curve varies a lot between seeds — precomputing
    // lets us fit each one to its frame instead of letting some spill out.
    const count = Math.floor(LIMIT / STEP) + 1
    const pts = new Float32Array(count * 2)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < count; i++) {
      const time = i * STEP
      let x = 0
      let y = 0
      for (const p of px)
        x +=
          p.amp * Math.sin(p.freq * time + p.phase) * Math.exp(-p.decay * time)
      for (const p of py)
        y +=
          p.amp * Math.sin(p.freq * time + p.phase) * Math.exp(-p.decay * time)
      pts[i * 2] = x
      pts[i * 2 + 1] = y
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }

    let w = 0
    let h = 0
    let scale = 1
    let ox = 0
    let oy = 0
    let head = 0

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.clearRect(0, 0, w, h)

      // Uniform scale, so the figure is fitted but never distorted.
      const spanX = Math.max(1e-6, maxX - minX)
      const spanY = Math.max(1e-6, maxY - minY)
      scale = Math.min((w - PAD * 2) / spanX, (h - PAD * 2) / spanY)
      ox = (w - spanX * scale) / 2 - minX * scale
      oy = (h - spanY * scale) / 2 - minY * scale

      c.globalCompositeOperation = 'lighter'
      c.lineWidth = 1
      c.lineCap = 'round'
      head = 0
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    // Additive, very low alpha: the line crosses itself thousands of times and
    // the overlaps are what make it glow.
    return onFrame(() => {
      if (head >= count - 1) return
      const end = Math.min(count - 1, head + PER_FRAME)

      c.beginPath()
      c.moveTo(pts[head * 2] * scale + ox, pts[head * 2 + 1] * scale + oy)
      for (let i = head + 1; i <= end; i++) {
        c.lineTo(pts[i * 2] * scale + ox, pts[i * 2 + 1] * scale + oy)
      }

      const fade = 1 - head / count
      c.strokeStyle = `rgba(255, 159, 69, ${(0.05 + fade * 0.05).toFixed(3)})`
      c.shadowColor = 'rgba(255, 159, 69, 0.5)'
      c.shadowBlur = 6
      c.stroke()

      head = end
    })
  }, [seed, active])

  return <canvas ref={ref} className={className} aria-hidden />
}
