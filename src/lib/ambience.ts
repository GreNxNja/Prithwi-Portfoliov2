import { getAnalyser } from '#/lib/audio'
import { onFrame } from '#/lib/frame'

/**
 * Publishes two numbers to the document as CSS custom properties, and lets the
 * stylesheet decide what to do with them:
 *
 *   --energy  0–1, how loud the instrument is right now
 *   --scroll  0–1, progress down the page
 *
 * The backdrop glow breathes on --energy, so the room genuinely lights up with
 * what you play rather than looping a canned animation. --scroll warms and
 * cools the same glow as you move between the human and machine halves.
 */
export function startAmbience() {
  if (typeof window === 'undefined') return () => {}

  const root = document.documentElement
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let bins: Uint8Array | null = null
  let energy = 0
  let scroll = 0

  return onFrame((dt) => {
    const analyser = getAnalyser()
    let target = 0

    if (analyser) {
      if (!bins || bins.length !== analyser.frequencyBinCount) {
        bins = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteTimeDomainData(bins as Uint8Array<ArrayBuffer>)
      // Peak deviation from the zero line, which tracks a plucked note's decay
      // far more musically than an average would.
      let peak = 0
      for (let i = 0; i < bins.length; i += 4) {
        const v = Math.abs(bins[i] - 128)
        if (v > peak) peak = v
      }
      target = Math.min(1, (peak / 128) * 2.6)
    }

    // Snap up on the attack, fall away slowly — the shape of a real note.
    const rate = target > energy ? 18 : 2.4
    energy += (target - energy) * Math.min(1, dt * rate)

    const max = document.body.scrollHeight - window.innerHeight
    const next = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    scroll += (next - scroll) * Math.min(1, dt * 6)

    root.style.setProperty(
      '--energy',
      (calm ? target * 0.3 : energy).toFixed(4),
    )
    root.style.setProperty('--scroll', scroll.toFixed(4))
  })
}
