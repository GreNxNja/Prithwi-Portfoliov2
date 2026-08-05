/**
 * A guitar, in about two hundred lines. No libraries — that's the point.
 *
 * Karplus-Strong: seed a delay line with noise, then feed it back through a
 * one-pole lowpass. Delay length sets the pitch. The lowpass is why the highs
 * die before the fundamental does, same as a real string. We render each pluck
 * into an AudioBuffer up front, so there's no deprecated ScriptProcessor and no
 * separate AudioWorklet file to ship.
 */

type Rig = {
  ctx: AudioContext
  bus: GainNode
  master: GainNode
  analyser: AnalyserNode
}

let rig: Rig | null = null
let muted = false

/** Rendered strings, keyed by pitch + brightness. Plucking is then free. */
const cache = new Map<string, AudioBuffer>()

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

export function rigUp(): Rig | null {
  if (typeof window === 'undefined') return null
  if (rig) return rig

  const ctx = new AudioContext()

  const master = ctx.createGain()
  master.gain.value = 0.85

  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.7

  master.connect(analyser)
  analyser.connect(ctx.destination)

  const bus = ctx.createGain()
  bus.connect(master)

  // A room, cheaply: two detuned feedback delays panned apart.
  const taps: Array<[number, number, number]> = [
    [0.223, 0.3, -0.55],
    [0.311, 0.26, 0.55],
  ]
  for (const [time, feedback, pan] of taps) {
    const delay = ctx.createDelay(1)
    delay.delayTime.value = time

    const fb = ctx.createGain()
    fb.gain.value = feedback

    const damp = ctx.createBiquadFilter()
    damp.type = 'lowpass'
    damp.frequency.value = 2000

    const wet = ctx.createGain()
    wet.gain.value = 0.2

    const panner = ctx.createStereoPanner()
    panner.pan.value = pan

    bus.connect(delay)
    delay.connect(damp)
    damp.connect(fb)
    fb.connect(delay)
    damp.connect(wet)
    wet.connect(panner)
    panner.connect(master)
  }

  rig = { ctx, bus, master, analyser }
  return rig
}

/** Browsers keep the context suspended until a real gesture. */
export function wake() {
  const r = rigUp()
  if (r && r.ctx.state === 'suspended') void r.ctx.resume()
}

function render(ctx: AudioContext, freq: number, bright: number): AudioBuffer {
  const key = `${freq.toFixed(1)}|${bright.toFixed(2)}`
  const hit = cache.get(key)
  if (hit) return hit

  const sr = ctx.sampleRate
  // Low strings ring longer, which is also true of the real thing.
  const seconds = clamp(2.4 + 90 / freq, 2.4, 5)
  const n = Math.floor(sr * seconds)
  const period = Math.max(2, Math.round(sr / freq))

  const buf = ctx.createBuffer(1, n, sr)
  const out = buf.getChannelData(0)

  // The excitation. A softer pluck starts with a duller noise burst.
  const ring = new Float32Array(period)
  let smoothed = 0
  const openness = 0.2 + bright * 0.8
  for (let i = 0; i < period; i++) {
    const white = Math.random() * 2 - 1
    smoothed += (white - smoothed) * openness
    ring[i] = smoothed
  }

  // The string itself.
  const feedback = 0.9958
  let prev = 0
  let idx = 0
  for (let i = 0; i < n; i++) {
    const cur = ring[idx]
    ring[idx] = (cur + prev) * 0.5 * feedback
    prev = cur
    out[i] = cur
    idx = idx + 1 === period ? 0 : idx + 1
  }

  // Fade the tail so the buffer never clicks off.
  const fade = Math.min(n, Math.floor(sr * 0.4))
  for (let i = 0; i < fade; i++) out[n - fade + i] *= 1 - i / fade

  cache.set(key, buf)
  return buf
}

export type PluckOptions = {
  /** 0–1. How hard. Drives gain and a little of the brightness. */
  velocity?: number
  /** 0–1 along the string. Near the bridge is brighter, same as a real one. */
  position?: number
  /** Seconds from now. */
  delay?: number
}

export function pluck(freq: number, options: PluckOptions = {}) {
  const r = rigUp()
  if (!r || muted) return
  wake()

  const velocity = clamp(options.velocity ?? 0.6, 0.05, 1)
  const position = clamp(options.position ?? 0.5, 0.04, 0.96)
  const when = r.ctx.currentTime + (options.delay ?? 0)

  // Pluck near either end and you get more harmonics. Middle is mellow.
  const bright = clamp(
    0.22 + Math.abs(position - 0.5) * 1.25 + velocity * 0.2,
    0.15,
    0.95,
  )

  const src = r.ctx.createBufferSource()
  // Quantise brightness so the cache actually hits.
  src.buffer = render(r.ctx, freq, Math.round(bright * 6) / 6)
  src.detune.value = (Math.random() - 0.5) * 6 // nobody is perfectly in tune

  const tone = r.ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 800 + bright * 6500
  tone.Q.value = 0.7

  const gain = r.ctx.createGain()
  gain.gain.value = 0.08 + velocity * 0.3

  src.connect(tone)
  tone.connect(gain)
  gain.connect(r.bus)

  src.start(when)
  src.onended = () => {
    src.disconnect()
    tone.disconnect()
    gain.disconnect()
  }
}

/** Roll a chord, one string at a time. */
export function strum(
  freqs: Array<number>,
  options: PluckOptions & { spread?: number } = {},
) {
  const spread = options.spread ?? 0.055
  freqs.forEach((f, i) => {
    pluck(f, { ...options, delay: (options.delay ?? 0) + i * spread })
  })
}

export function setMuted(next: boolean) {
  muted = next
  const r = rigUp()
  if (!r) return
  r.master.gain.setTargetAtTime(next ? 0 : 0.85, r.ctx.currentTime, 0.03)
}

export function isMuted() {
  return muted
}

export function getAnalyser() {
  return rigUp()?.analyser ?? null
}
