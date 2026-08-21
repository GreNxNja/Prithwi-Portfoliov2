import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { pluck, wake } from '#/lib/audio'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'
import {
  STRING_BOTTOM,
  STRING_TOP,
  TUNING,
  emitPluck,
  onPluck,
  stringY,
} from '#/lib/tuning'

/** How many modes of the standing wave we bother to draw. */
const MODES = 4

/**
 * Catch radius and pull limit are derived from the gap between strings, not
 * fixed: on a short viewport the strings crowd together, and fixed values would
 * overlap the catch zones and let a bent string cross its neighbour.
 */
const catchRadius = (gap: number) => Math.max(9, Math.min(26, gap * 0.45))
const pullLimit = (gap: number) => Math.max(13, Math.min(46, gap * 0.92))

const EMBER = [255, 159, 69] as const
const IDLE = [58, 58, 70] as const

type StringState = {
  amp: Float32Array
  clock: number
  grab: { x: number; y: number } | null
  glow: number
  /** Where it was last struck, for the bloom flash. */
  hitX: number
  hitY: number
}

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
}

/**
 * A plucked string is a sum of standing waves. Amplitude of mode m for a
 * triangular displacement d pulled at position p along the string:
 *
 *   A(m) = 2d / (m²π² · p(1-p)) · sin(mπp)
 *
 * Which is why plucking dead centre silences every even mode, and why plucking
 * near the bridge sounds thin — the same maths drives the audio.
 */
function excite(target: Float32Array, displacement: number, position: number) {
  const p = Math.min(0.97, Math.max(0.03, position))
  for (let m = 1; m <= MODES; m++) {
    const a =
      ((2 * displacement) / (m * m * Math.PI * Math.PI * p * (1 - p))) *
      Math.sin(m * Math.PI * p)
    target[m - 1] += a
  }
}

export function Instrument() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const c = canvas.getContext('2d')
    if (!c) return

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /*
     * The per-frame budget, sized to the device.
     *
     * Canvas shadows are the single most expensive thing in this loop — the
     * whole path is rasterised twice and blurred — so the trail count and the
     * segment count are what everything else is paid out of. Two passes at 88
     * segments is indistinguishable from three at 120 once the string is
     * actually moving, and costs a bit over half as much. A phone drops to one
     * flat pass with no glow at all.
     */
    const lean = isLowPower()
    /** Afterimages behind a moving string — why it reads as blur, not a wire. */
    const TRAILS = lean ? 1 : 2
    const SEGMENTS = lean ? 64 : 88
    const MAX_SPARKS = lean ? 36 : 80
    const GLOW = !lean

    const strings: Array<StringState> = TUNING.map(() => ({
      amp: new Float32Array(MODES),
      clock: 0,
      grab: null,
      glow: 0,
      hitX: 0,
      hitY: 0,
    }))
    const sparks: Array<Spark> = []

    let w = 0
    let h = 0
    let x0 = 0
    let x1 = 0
    let gap = 0
    let held = -1
    let pointer: { x: number; y: number } | null = null

    const resize = () => {
      // Phones ship 3x screens; rasterising this canvas at 3x is three times
      // the fill for a difference nobody can see on a hairline stroke.
      const dpr = Math.min(lean ? 1.5 : 2, window.devicePixelRatio || 1)
      // Read the canvas's own laid-out size and only ever write the backing
      // store. Writing style.width/height too would override the inset-0
      // stretch and quietly desync the strings from their DOM labels.
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      // The strings stop where the labels begin — the headstock. Measured
      // rather than guessed from breakpoints, so it stays correct at every
      // width and survives the labels changing length.
      x0 = w * 0.05
      const wrapLeft = wrap.getBoundingClientRect().left
      let labelLeft = w
      for (const el of wrap.querySelectorAll<HTMLElement>(
        '[data-string-label]',
      )) {
        labelLeft = Math.min(
          labelLeft,
          el.getBoundingClientRect().left - wrapLeft,
        )
      }
      x1 = Math.max(x0 + 80, Math.min(w * 0.85, labelLeft - 22))
      gap = ((STRING_BOTTOM - STRING_TOP) * h) / (TUNING.length - 1)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const baseline = (i: number) => stringY(i) * h

    const spawnSparks = (x: number, y: number, force: number) => {
      if (calm) return
      const n = Math.round(6 + force * 14)
      for (let k = 0; k < n && sparks.length < MAX_SPARKS; k++) {
        const a = Math.random() * Math.PI * 2
        const speed = (18 + Math.random() * 70) * (0.4 + force)
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed * 0.7,
          age: 0,
          life: 0.45 + Math.random() * 0.55,
        })
      }
    }

    /** Release a held string, or fire one programmatically. */
    const release = (i: number, displacement: number, position: number) => {
      const s = strings[i]
      excite(s.amp, displacement, position)
      s.clock = 0
      s.glow = 1
      s.hitX = x0 + (x1 - x0) * position
      s.hitY = baseline(i)
      const velocity = Math.min(1, Math.abs(displacement) / pullLimit(gap))
      spawnSparks(s.hitX, s.hitY, velocity)
      pluck(TUNING[i].freq, { velocity: 0.25 + velocity * 0.75, position })
      emitPluck(i, { velocity, position })
    }

    // Labels and the keyboard can pluck too; the canvas just draws the result.
    const off = onPluck((i, ev) => {
      const s = strings[i]
      if (s.grab) return
      excite(s.amp, pullLimit(gap) * (0.35 + ev.velocity * 0.5), ev.position)
      s.clock = 0
      s.glow = 1
      s.hitX = x0 + (x1 - x0) * ev.position
      s.hitY = baseline(i)
      spawnSparks(s.hitX, s.hitY, ev.velocity)
    })

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const onDown = (e: PointerEvent) => {
      wake()
      const p = local(e)
      if (p.x < x0 - 20 || p.x > x1 + 20) return

      let best = -1
      let bestDist = catchRadius(gap)
      for (let i = 0; i < strings.length; i++) {
        const d = Math.abs(p.y - baseline(i))
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      }
      if (best === -1) return

      held = best
      strings[best].amp.fill(0)
      strings[best].grab = p
      pointer = p
      setTouched(true)
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        // Capture is a nicety — the window-level move/up listeners already
        // cover the pointer leaving the canvas.
      }
      // Only for a mouse or pen. On touch the browser owns this gesture until
      // it decides whether the finger is scrolling, and preventing the default
      // here fights that decision.
      if (e.pointerType !== 'touch') e.preventDefault()
    }

    const onMove = (e: PointerEvent) => {
      const p = local(e)
      pointer = p
      if (held === -1) return
      const base = baseline(held)
      const limit = pullLimit(gap)
      strings[held].grab = {
        x: Math.min(x1, Math.max(x0, p.x)),
        y: base + Math.max(-limit, Math.min(limit, p.y - base)),
      }
    }

    const onUp = () => {
      if (held === -1) return
      const s = strings[held]
      const grab = s.grab
      s.grab = null
      if (grab) {
        const displacement = grab.y - baseline(held)
        const position = (grab.x - x0) / (x1 - x0)
        // A tap with no drag still counts, just gently.
        release(held, Math.abs(displacement) < 1.5 ? 9 : displacement, position)
      }
      held = -1
    }

    /**
     * The browser decided this gesture was a scroll and took the pointer away.
     * Drop the string silently — releasing it here would mean every swipe that
     * happened to start on the strings played a note.
     */
    const onCancel = () => {
      if (held === -1) return
      strings[held].grab = null
      held = -1
    }

    const onLeave = () => {
      pointer = null
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (!Number.isInteger(n) || n < 1 || n > TUNING.length) return
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
      wake()
      setTouched(true)
      release(n - 1, pullLimit(gap) * 0.55, 0.28 + Math.random() * 0.44)
    }

    canvas.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    canvas.addEventListener('pointerleave', onLeave)
    window.addEventListener('keydown', onKey)

    /** Displacement of string i at 0–1 along its length, at a given time. */
    const shape = (s: StringState, i: number, t: number, clock: number) => {
      let y = 0
      for (let m = 1; m <= MODES; m++) {
        const a = s.amp[m - 1]
        if (Math.abs(a) < 0.04) continue
        y +=
          a *
          Math.sin(m * Math.PI * t) *
          Math.cos(2 * Math.PI * TUNING[i].visualFreq * m * clock)
      }
      return y
    }

    const stop = onFrame((dt) => {
      c.clearRect(0, 0, w, h)

      // Nut and bridge.
      c.strokeStyle = 'rgba(120,120,140,0.22)'
      c.lineWidth = 1
      for (const x of [x0, x1]) {
        c.beginPath()
        c.moveTo(x, baseline(0) - 22)
        c.lineTo(x, baseline(strings.length - 1) + 22)
        c.stroke()
      }

      // Position markers, in the places a fretboard actually has them.
      const mid = (baseline(0) + baseline(strings.length - 1)) / 2
      c.fillStyle = 'rgba(120,120,140,0.16)'
      for (const at of [0.24, 0.42, 0.56, 0.68]) {
        c.beginPath()
        c.arc(x0 + (x1 - x0) * at, mid, 2.5, 0, Math.PI * 2)
        c.fill()
      }

      for (let i = 0; i < strings.length; i++) {
        const s = strings[i]
        const def = TUNING[i]
        const base = baseline(i)
        s.clock += dt

        // Modal decay: higher modes die as m², which is why a plucked string
        // turns from bright to round within a few hundred milliseconds.
        for (let m = 1; m <= MODES; m++) {
          s.amp[m - 1] *= Math.exp((-dt * m * m) / (calm ? 0.7 : 1.7))
        }
        s.glow = Math.max(0, s.glow - dt * 1.15)

        const energy = Math.min(1, Math.abs(s.amp[0]) / 26)
        const heat = Math.max(energy, s.glow * 0.7)

        // The bloom where the pick landed.
        if (GLOW && s.glow > 0.01) {
          const r = 26 + (1 - s.glow) * 90
          const bloom = c.createRadialGradient(
            s.hitX,
            s.hitY,
            0,
            s.hitX,
            s.hitY,
            r,
          )
          bloom.addColorStop(0, `rgba(255,175,100,${s.glow * 0.3})`)
          bloom.addColorStop(1, 'rgba(255,159,69,0)')
          c.fillStyle = bloom
          c.fillRect(s.hitX - r, s.hitY - r, r * 2, r * 2)
        }

        const passes = calm || heat < 0.02 ? 1 : TRAILS
        for (let k = passes - 1; k >= 0; k--) {
          // Each afterimage samples the string slightly back in time.
          const clock = s.clock - k * 0.014
          const fade = k === 0 ? 1 : 0.28 / k

          c.beginPath()
          for (let j = 0; j <= SEGMENTS; j++) {
            const t = j / SEGMENTS
            const px = x0 + (x1 - x0) * t
            let py = base

            if (s.grab) {
              // Held: a straight-sided triangle pinned at both ends.
              const gt = (s.grab.x - x0) / (x1 - x0)
              const pull = s.grab.y - base
              py = base + pull * (t < gt ? t / gt : (1 - t) / (1 - gt))
            } else {
              py += shape(s, i, t, clock)
              if (!calm) {
                // Barely-there ambience, so idle strings still feel like objects.
                py += Math.sin(s.clock * 0.7 + i * 1.9 + t * Math.PI) * 0.5
                if (pointer) {
                  const near = Math.exp(-(((px - pointer.x) / 100) ** 2))
                  const reach = Math.max(0, 1 - Math.abs(pointer.y - base) / 80)
                  py += Math.sign(pointer.y - base) * near * reach * 6
                }
              }
            }

            if (j === 0) c.moveTo(px, py)
            else c.lineTo(px, py)
          }

          const col = IDLE.map((v, n) => Math.round(v + (EMBER[n] - v) * heat))
          c.strokeStyle =
            k === 0
              ? `rgb(${col[0]},${col[1]},${col[2]})`
              : `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},${(heat * fade).toFixed(3)})`
          c.lineWidth = def.gauge * (k === 0 ? 1 : 0.8)
          c.lineCap = 'round'
          // Canvas shadows rasterise the path twice and blur it, so this is
          // the most expensive line in the loop. Gate it on a note that is
          // actually audible rather than on any trace of movement — below
          // about a quarter heat the glow is invisible against the backdrop
          // anyway, and that covers most of a note's decay.
          if (GLOW && k === 0 && heat > 0.25) {
            c.shadowColor = `rgba(255,159,69,${heat * 0.85})`
            c.shadowBlur = 10 + heat * 30
          }
          c.stroke()
          c.shadowBlur = 0
        }
      }

      // Sparks last, added rather than painted over, so they read as light.
      if (sparks.length) {
        c.globalCompositeOperation = 'lighter'
        for (let i = sparks.length - 1; i >= 0; i--) {
          const p = sparks[i]
          p.age += dt
          if (p.age >= p.life) {
            sparks.splice(i, 1)
            continue
          }
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.vy += 42 * dt // settles downward
          p.vx *= 1 - 1.6 * dt
          p.vy *= 1 - 1.6 * dt
          const k = 1 - p.age / p.life
          c.fillStyle = `rgba(255,${Math.round(150 + 80 * k)},${Math.round(60 + 90 * (1 - k))},${(k * 0.65).toFixed(3)})`
          c.beginPath()
          c.arc(p.x, p.y, 0.6 + k * 1.7, 0, Math.PI * 2)
          c.fill()
        }
        c.globalCompositeOperation = 'source-over'
      }
    })

    return () => {
      stop()
      ro.disconnect()
      off()
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      canvas.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {/*
        pan-y, not none. The strings fill half the first screen on a phone, and
        touch-action: none there makes the whole landing view a dead zone you
        cannot swipe past. This hands vertical panning back to the browser —
        so the page scrolls — while horizontal movement still reaches the
        canvas for bending a string along its length. A tap still plucks.
      */}
      <canvas
        ref={canvasRef}
        className="pick-cursor absolute inset-0 h-full w-full touch-pan-y"
      />

      {TUNING.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          data-string-label
          onClick={() => {
            wake()
            pluck(s.freq, { velocity: 0.5, position: 0.4 })
            emitPluck(i, { velocity: 0.5, position: 0.4 })
          }}
          // 11px of margin each side: the strings sit ~25px apart here, so
          // this is the most hit area the labels can take without two of them
          // overlapping. Already absolute, so the pseudo-element has something
          // to position against.
          style={
            { top: `${stringY(i) * 100}%`, '--tap-y': '11px' } as CSSProperties
          }
          className="group tap absolute right-[3vw] flex -translate-y-1/2 items-baseline gap-3 font-mono text-xs tracking-widest text-muted transition-all duration-300 hover:-translate-x-1 hover:text-ember focus-visible:text-ember focus-visible:outline-none sm:right-[5vw]"
        >
          <span className="hidden tabular-nums opacity-50 group-hover:opacity-100 sm:inline">
            {s.index}
          </span>
          <span className="uppercase">{s.label}</span>
          <span className="w-7 text-right opacity-40 group-hover:text-ember group-hover:opacity-100">
            {s.note}
          </span>
        </a>
      ))}

      {/* Two instructions, because the gesture genuinely differs: a mouse can
          pull a string off its rest position, a finger can't without the page
          scrolling out from under it. CSS picks, so there's no hydration gap. */}
      <p
        className={`pointer-events-none absolute bottom-4 left-[5vw] font-mono text-[0.65rem] tracking-[0.2em] text-muted uppercase transition-opacity duration-700 sm:text-[0.7rem] ${
          touched ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <span className="hidden [@media(hover:hover)and(pointer:fine)]:inline">
          <span className="text-ember">↔</span> drag a string, then let go
          <span className="mx-3 opacity-30">·</span>
          or press <span className="text-ember">1–6</span>
        </span>
        <span className="[@media(hover:hover)and(pointer:fine)]:hidden">
          <span className="text-ember">♪</span> tap a string
        </span>
      </p>
    </div>
  )
}
