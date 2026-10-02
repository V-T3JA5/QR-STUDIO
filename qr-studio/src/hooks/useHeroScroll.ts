import { RefObject, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import anime from 'animejs'
gsap.registerPlugin(ScrollTrigger)
const HEADER_H = 56, DOCKED_PX = 22
/** Desktop only. GSAP owns the wordmark transform; anime.js owns the parallax layer (seeked from scroll progress). */
export function useHeroScroll(hero: RefObject<HTMLElement>, mark: RefObject<HTMLElement>, bar: RefObject<HTMLElement>, depth: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width:1024px) and (prefers-reduced-motion:no-preference)', () => {
      const par = anime({ targets: depth.current, translateY: [0, -120], opacity: [1, 0], easing: 'linear', autoplay: false, duration: 1000 })
      gsap.set(mark.current, { xPercent: -50, transformOrigin: '50% 50%' })
      gsap.set(bar.current, { opacity: 0 })
      const tl = gsap.timeline({
        scrollTrigger: { trigger: hero.current, start: 'top top', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: self => par.seek(par.duration * self.progress) },
      })
      tl.fromTo(mark.current,
        { scale: () => (innerWidth * 0.14) / DOCKED_PX, y: () => innerHeight / 2 - HEADER_H / 2 },
        { scale: 1, y: 0, ease: 'power2.inOut' }, 0)
       .to(bar.current, { opacity: 1, ease: 'none' }, 0.7)
      return () => { par.pause() }
    })
    mm.add('(max-width:1023px), (prefers-reduced-motion:reduce)', () => { gsap.set(mark.current, { xPercent: -50, scale: 1, y: 0 }); gsap.set(bar.current, { opacity: 1 }) })
    return () => mm.revert()
  }, [])
}
