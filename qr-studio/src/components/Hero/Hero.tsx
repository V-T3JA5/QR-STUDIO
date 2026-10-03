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

  if (!isDesktop) return null
  // Once fully faded, remove the hero from the layout entirely so it can't
  // intercept scroll/clicks over the workspace beneath it.
  if (docked) return null

  // Simple crossfade: the whole hero fades out as a unit over the scroll
  // distance, no positional morphing into the header.
  const opacity = Math.max(0, 1 - progress * 1.15)
  const scale = 1 - progress * 0.04 // barely-there scale-down, not a dock animation

  return (
    <div ref={heroRef} style={{ height: '140vh' }}>
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{ opacity, pointerEvents: progress > 0.85 ? 'none' : 'auto' }}
      >
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-[#060608]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 70% 40%, rgba(181,87,126,0.20), transparent 60%), radial-gradient(ellipse 50% 40% at 20% 70%, rgba(45,226,230,0.10), transparent 60%)',
            }}
          />
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
          style={{ transform: `scale(${scale})` }}
        >
          {/* Left: bold type + hairline card, BAZAAR-reference inspired */}
          <div className="space-y-6">
            <p data-hero-fade className="text-xs tracking-[0.25em] text-cyan-300/60 uppercase font-medium">
              QR Studio
            </p>
            <h1
              data-hero-fade
              className="font-display font-bold text-white leading-[0.95] tracking-tight"
              style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)' }}
            >
              DESIGN
              <br />
              CODES THAT
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-accent-bright bg-clip-text text-transparent">
                GLOW.
              </span>
            </h1>

            <div data-hero-fade className="border border-white/15 rounded-2xl p-5 max-w-sm bg-white/[0.02]">
              <p className="text-neutral-400 text-sm leading-relaxed">
                A browser-based QR design studio — style, brand, and export scannable codes in real time.
              </p>
              <button
                onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white group"
              >
                Start designing
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>

          {/* Right: 3D scene */}
          <div data-hero-fade className="h-[420px]">
            <HeroQRScene />
          </div>
        </div>
      </div>
    </div>
  )
}
