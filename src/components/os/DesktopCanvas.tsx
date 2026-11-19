"use client";

import { useEffect, useRef, useState } from "react";
import { WALLPAPERS, WALLPAPER_STORAGE_KEY, getWallpaper, Wallpaper } from "@/lib/wallpapers";

const PARTICLE_COUNT = 70;

export function DesktopCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [activeWallpaper, setActiveWallpaper] = useState<Wallpaper>(() => {
    try {
      return getWallpaper(localStorage.getItem(WALLPAPER_STORAGE_KEY));
    } catch {
      return WALLPAPERS[0];
    }
  });
  const wallpaperRef = useRef<Wallpaper>(activeWallpaper);

  useEffect(() => {
    const onPick = (e: Event) => {
      const next = getWallpaper((e as CustomEvent<string>).detail);
      wallpaperRef.current = next;
      setActiveWallpaper(next);
    };
    window.addEventListener("aura:wallpaper", onPick);
    return () => window.removeEventListener("aura:wallpaper", onPick);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = (canvas.width = window.innerWidth * dpr);
    let h = (canvas.height = window.innerHeight * dpr);
    const seed = Math.floor(Math.random() * 2 ** 31);
    const start = performance.now();

    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.42,
      vy: (Math.random() - 0.5) * 0.42,
      r: Math.random() * 1.6 + 0.4,
    }));

    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      const current = wallpaperRef.current;
      try {
        current.draw(ctx, w, h, t, seed);
      } catch {
        WALLPAPERS[0].draw(ctx, w, h, t, seed);
      }

      const maxDist = 115 * dpr;
      const maxDistSq = maxDist * maxDist;
      ctx.strokeStyle = current.palette.constellation;
      ctx.lineWidth = 0.75 * dpr;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          if (dx * dx + dy * dy < maxDistSq) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = current.palette.particle;
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const onResize = () => {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
    };
    const onVisibilityChange = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        raf = requestAnimationFrame(tick);
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const { palette } = activeWallpaper;

  return (
    <div
      suppressHydrationWarning
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: palette.bg }}
    >
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      {/* Theme-reactive ambient orbs */}
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute left-[14%] top-[18%] h-[28rem] w-[28rem] rounded-full blur-3xl transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${palette.orbA} 0%, transparent 70%)` }}
        />
        <div
          className="absolute right-[16%] top-[26%] h-[26rem] w-[26rem] rounded-full blur-3xl transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${palette.orbB} 0%, transparent 70%)` }}
        />
        <div
          className="absolute bottom-[14%] left-[34%] h-[24rem] w-[24rem] rounded-full blur-3xl transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${palette.orbC} 0%, transparent 70%)` }}
        />
      </div>
      {/* Architectural theme-tinted micro-grid + subtle legibility vignette */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          backgroundImage: `linear-gradient(${palette.grid} 1px, transparent 1px), linear-gradient(90deg, ${palette.grid} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.42)_100%)]"
        aria-hidden="true"
      />
    </div>
  );
}
