import { useEffect, useRef, useState } from 'react'
import anime from 'animejs'
import { HeroQRScene } from './HeroQRScene'
import { useHeroScroll } from '@/hooks/useHeroScroll'

interface Props {
  onDockedChange: (docked: boolean) => void
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const listener = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])
  return isDesktop
}

export function Hero({ onDockedChange }: Props) {
  const isDesktop = useIsDesktop()
  const heroRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { progress, docked } = useHeroScroll(heroRef, isDesktop)

  useEffect(() => {
    onDockedChange(docked)
  }, [docked, onDockedChange])

  // One-time entrance animation on load (desktop only — mobile skips the hero).
  useEffect(() => {
    if (!isDesktop || !contentRef.current) return
    anime({
      targets: contentRef.current.querySelectorAll('[data-hero-fade]'),
      opacity: [0, 1],
      translateY: [24, 0],
      delay: anime.stagger(90),
      duration: 700,
      easing: 'easeOutQuad',
    })
  }, [isDesktop])

  // Mobile: hero is skipped entirely, workspace starts immediately.
  if (!isDesktop) return null

  // Interpolated scroll-dock transform.
  const scale = 1 - progress * 0.72
  const translateY = -progress * 220
  const sceneOpacity = Math.max(0, 1 - progress * 1.3)
  const showScene = progress < 0.85

  return (
    <div ref={heroRef} style={{ height: '180vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-[#060610]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 70% 40%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 20% 70%, rgba(45,226,230,0.10), transparent 60%)',
            }}
          />
          {/* Minimal particles */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20 blur-[1px]"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                top: `${(i * 37) % 100}%`,
                left: `${(i * 53) % 100}%`,
                opacity: 0.15 + ((i * 13) % 40) / 100,
              }}
            />
          ))}
        </div>

        <div
          ref={contentRef}
          className="relative h-full max-w-6xl mx-auto px-8 grid grid-cols-2 items-center gap-8"
          style={{
            transform: `translateY(${translateY}px) scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Left: copy + CTA */}
          <div className="space-y-5">
            <p data-hero-fade className="text-sm tracking-widest text-cyan-300/70 uppercase">
              QR Studio
            </p>
            <h1 data-hero-fade className="text-5xl font-display font-semibold text-white leading-tight">
              Design codes
              <br />
              that glow.
            </h1>
            <p data-hero-fade className="text-neutral-400 text-base max-w-sm">
              A browser-based QR design studio — style, brand, and export scannable codes in real time.
            </p>
            <button
              data-hero-fade
              onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-medium text-sm"
            >
              Start designing
            </button>
          </div>

          {/* Right: 3D QR */}
          <div data-hero-fade className="h-[420px]" style={{ opacity: sceneOpacity }}>
            {showScene && <HeroQRScene />}
          </div>
        </div>
      </div>
    </div>
  )
}
