'use client'

import { useEffect, useRef, useState, ReactNode, CSSProperties } from 'react'

/* ─────────────────────────────────────────────
   FadeIn — enters with opacity + translate Y
   ───────────────────────────────────────────── */
export function FadeIn({ children, delay = 0, duration = 500, y = 20, className = '' }: {
  children: ReactNode; delay?: number; duration?: number; y?: number; className?: string
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ScaleIn — scales from 0.92
   ───────────────────────────────────────────── */
export function ScaleIn({ children, delay = 0, className = '' }: {
  children: ReactNode; delay?: number; className?: string
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setTimeout(() => setVisible(true), delay); observer.disconnect() }
    }, { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.92)',
        transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   GlowPulse — neon green glow animation
   ───────────────────────────────────────────── */
export function GlowPulse({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}
      style={{
        animation: 'pai-glow-pulse 2.5s ease-in-out infinite',
      }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ShimmerText — gradient-shifting text
   ───────────────────────────────────────────── */
export function ShimmerText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}
      style={{
        background: 'linear-gradient(90deg, #39FF14 0%, #6bff4a 25%, #39FF14 50%, #00CC00 75%, #39FF14 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: 'pai-shimmer 3s ease-in-out infinite',
      }}>
      {text}
    </span>
  )
}

/* ─────────────────────────────────────────────
   TiltCard — 3D perspective tilt on mouse move
   ───────────────────────────────────────────── */
export function TiltCard({ children, className = '', maxTilt = 8 }: {
  children: ReactNode; className?: string; maxTilt?: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({})

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setStyle({
      transform: `perspective(1000px) rotateX(${(y - 0.5) * -maxTilt}deg) rotateY(${(x - 0.5) * maxTilt}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out',
    })
  }

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    })
  }

  return (
    <div ref={cardRef} className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, willChange: 'transform' }}>
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ParticleField — floating particles (CSS driven)
   ───────────────────────────────────────────── */
export function ParticleField({ count = 30, color = 'rgba(57,255,20,0.3)', className = '' }: {
  count?: number; color?: string; className?: string
}) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    size: 2 + Math.random() * 3,
    duration: 6 + Math.random() * 8,
  }))

  return (
    <div className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <style>{`
        @keyframes pai-particle-drift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-120px) translateX(40px) scale(0.3); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            animation: `pai-particle-drift ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Typewriter — typing animation
   ───────────────────────────────────────────── */
export function Typewriter({ text, speed = 50, className = '', onComplete }: {
  text: string; speed?: number; className?: string; onComplete?: () => void
}) {
  const [displayed, setDisplayed] = useState('')
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setTimeout(() => setCursor(false), 1000)
        onComplete?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return (
    <span className={className}>
      {displayed}
      {cursor && <span style={{ animation: 'pai-blink 1s step-end infinite' }}>▌</span>}
    </span>
  )
}

/* ─────────────────────────────────────────────
   MorphingView — each step morphs the UI
   AlphaZero Sandbox: the page IS the state
   ───────────────────────────────────────────── */
export function MorphingView({ current, views, className = '' }: {
  current: number; views: ReactNode[]; className?: string
}) {
  const prevRef = useRef(current)

  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden' }}>
      {views.map((view, i) => (
        <div key={i}
          style={{
            position: i === current ? 'relative' : 'absolute',
            inset: 0,
            opacity: i === current ? 1 : 0,
            transform: i === current
              ? 'translateX(0) scale(1)'
              : i < current
                ? 'translateX(-60px) scale(0.95)'
                : 'translateX(60px) scale(0.95)',
            transition: 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: i === current ? 'auto' : 'none',
          }}>
          {view}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   NeuralNetworkViz — simple animated NN
   ───────────────────────────────────────────── */
export function NeuralNetworkViz({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = canvas.clientWidth * 2
    const H = canvas.height = canvas.clientHeight * 2

    const layers = [8, 12, 16, 10, 6]
    const neurons = layers.map((count, li) =>
      Array.from({ length: count }, (_, ni) => ({
        x: (W / (layers.length + 1)) * (li + 1),
        y: (H / (count + 1)) * (ni + 1),
        phase: Math.random() * Math.PI * 2,
      }))
    )

    let t = 0
    const draw = () => {
      t += 0.02
      ctx!.clearRect(0, 0, W, H)

      // Draw connections
      for (let l = 0; l < neurons.length - 1; l++) {
        for (const a of neurons[l]) {
          for (const b of neurons[l + 1]) {
            const alpha = 0.04 + 0.06 * (0.5 + 0.5 * Math.sin(t + a.phase + b.phase))
            ctx!.strokeStyle = `rgba(57, 255, 20, ${alpha})`
            ctx!.lineWidth = 1
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
          }
        }
      }

      // Draw neurons
      for (const layer of neurons) {
        for (const n of layer) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 2 + n.phase)
          const r = 4 + pulse * 3
          ctx!.beginPath()
          ctx!.arc(n.x, n.y, r, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(57, 255, 20, ${0.3 + pulse * 0.5})`
          ctx!.fill()
          ctx!.strokeStyle = `rgba(57, 255, 20, ${0.5 + pulse * 0.3})`
          ctx!.lineWidth = 1.5
          ctx!.stroke()
        }
      }

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return <canvas ref={canvasRef} className={className} style={{ width: '100%', height: '100%' }} />
}
