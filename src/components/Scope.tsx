import { useEffect, useRef } from 'react'
import { getAnalyser } from '#/lib/audio'
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

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
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

      const trace = (dir: number, alpha: number, width: number) => {
        c.beginPath()
        for (let i = 0; i < data!.length; i++) {
          const x = (i / (data!.length - 1)) * w
          const y = mid + dir * ((data![i] - 128) / 128) * (height * 0.44)
          if (i === 0) c.moveTo(x, y)
          else c.lineTo(x, y)
        }
        c.strokeStyle = `rgba(255,159,69,${alpha})`
        c.lineWidth = width
        c.stroke()
      }

      c.globalCompositeOperation = 'lighter'
      c.shadowColor = 'rgba(255,159,69,0.55)'
      c.shadowBlur = 10
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
