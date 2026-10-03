import { useEffect, useState, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Scroll distance (px) over which the hero shrinks into the docked header.
const DOCK_SCROLL_DISTANCE = 600

export function useHeroScroll(heroRef: RefObject<HTMLElement>, enabled: boolean) {
  const [progress, setProgress] = useState(0)
  const [docked, setDocked] = useState(false)

  useEffect(() => {
    if (!enabled || !heroRef.current) {
      // Mobile / disabled path: hero is skipped entirely, so treat as already docked.
      setDocked(true)
      setProgress(1)
      return
    }

    const trigger = ScrollTrigger.create({
      trigger: heroRef.current,
      start: 'top top',
      end: `+=${DOCK_SCROLL_DISTANCE}`,
      scrub: true,
      onUpdate: (self) => {
        setProgress(self.progress)
        setDocked(self.progress >= 0.98)
      },
    })

    return () => trigger.kill()
  }, [heroRef, enabled])

  return { progress, docked }
}
