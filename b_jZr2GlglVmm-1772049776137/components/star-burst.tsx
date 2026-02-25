"use client"

import { useEffect, useRef } from "react"

export function StarBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId: number
    let time = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Generate streaks
    const streaks: {
      angle: number
      speed: number
      length: number
      width: number
      color: string
      offset: number
    }[] = []

    const colors = [
      "rgba(255,255,255,",
      "rgba(255,255,255,",
      "rgba(255,100,40,",
      "rgba(200,180,255,",
      "rgba(255,140,60,",
      "rgba(255,255,255,",
    ]

    for (let i = 0; i < 120; i++) {
      streaks.push({
        angle: (Math.PI * 2 * i) / 120 + (Math.random() - 0.5) * 0.15,
        speed: 0.3 + Math.random() * 0.7,
        length: 80 + Math.random() * 220,
        width: 0.5 + Math.random() * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        offset: Math.random() * 100,
      })
    }

    const draw = () => {
      time += 0.008
      const w = canvas.width
      const h = canvas.height
      const cx = w * 0.5
      const cy = h * 0.52

      ctx.clearRect(0, 0, w, h)

      // Dark background
      ctx.fillStyle = "#050505"
      ctx.fillRect(0, 0, w, h)

      // Draw each streak
      for (const s of streaks) {
        const progress = ((time * s.speed + s.offset) % 1)
        const startDist = 20 + progress * 350
        const endDist = startDist + s.length * (0.3 + progress * 0.7)

        const x1 = cx + Math.cos(s.angle) * startDist
        const y1 = cy + Math.sin(s.angle) * startDist
        const x2 = cx + Math.cos(s.angle) * endDist
        const y2 = cy + Math.sin(s.angle) * endDist

        const alpha = Math.sin(progress * Math.PI) * 0.75

        const grad = ctx.createLinearGradient(x1, y1, x2, y2)
        grad.addColorStop(0, `${s.color}0)`)
        grad.addColorStop(0.3, `${s.color}${alpha.toFixed(2)})`)
        grad.addColorStop(1, `${s.color}0)`)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = grad
        ctx.lineWidth = s.width
        ctx.stroke()
      }

      // Soft center glow
      const radGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 180)
      radGlow.addColorStop(0, "rgba(60,60,80,0.25)")
      radGlow.addColorStop(1, "rgba(0,0,0,0)")
      ctx.fillStyle = radGlow
      ctx.fillRect(0, 0, w, h)

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  )
}
