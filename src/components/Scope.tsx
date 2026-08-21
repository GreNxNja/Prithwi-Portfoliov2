import { useEffect, useRef } from 'react'
import { getAnalyser } from '#/lib/audio'
import { isLowPower } from '#/lib/device'
import { onFrame } from '#/lib/frame'

/**
 * A real oscilloscope on the real output bus. Most portfolios draw a decorative
 * squiggle; this one is showing the strings you just plucked, mirrored below
 * the centre line so a loud note blooms outward from it.
 */
export function Scope({ height = 64 }: { height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const c = canvas.getContext('2d')
    if (!c) return

    let w = 0
    let data: Uint8Array | null = null

    /*
     * The analyser hands back 1024 samples. At a few hundred CSS pixels wide
     * that is three or four samples per pixel — invisible detail bought at full
     * price, twice over for the mirrored trace, with a shadow on top. On a
     * phone take every third sample and drop the glow.
     */
    const lean = isLowPower()
    // Even on a desktop this is ~1024 samples across a few hundred CSS pixels:
    // three or four per pixel, all of them paid for. Every other one is still
    // finer than the display can resolve.
    const STEP = lean ? 3 : 2

    const resize = () => {
      const dpr = Math.min(lean ? 1.5 : 2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(height * dpr)
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const stop = onFrame(() => {
      c.clearRect(0, 0, w, height)
      const mid = height / 2
      const analyser = getAnalyser()

      if (!analyser) {
        c.beginPath()
        c.moveTo(0, mid)
        c.lineTo(w, mid)
        c.strokeStyle = 'rgba(255,159,69,0.18)'
        c.lineWidth = 1
        c.stroke()
        return
      }

      if (!data || data.length !== analyser.frequencyBinCount) {
        data = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>)

      const last = data.length - 1
      const trace = (dir: number, alpha: number, width: number) => {
        c.beginPath()
        for (let i = 0; i <= last; i += STEP) {
          const x = (i / last) * w
          const y = mid + dir * ((data![i] - 128) / 128) * (height * 0.44)
          if (i === 0) c.moveTo(x, y)
          else c.lineTo(x, y)
        }
        c.strokeStyle = `rgba(255,159,69,${alpha})`
        c.lineWidth = width
        c.stroke()
      }

      c.globalCompositeOperation = 'lighter'
      if (!lean) {
        c.shadowColor = 'rgba(255,159,69,0.55)'
        c.shadowBlur = 6
      }
      trace(1, 0.7, 1.3)
      trace(-1, 0.22, 1) // the mirror
      c.shadowBlur = 0
      c.globalCompositeOperation = 'source-over'
    })

    return () => {
      stop()
      ro.disconnect()
    }
  }, [height])

  return <canvas ref={ref} className="w-full" style={{ height }} aria-hidden />
}
