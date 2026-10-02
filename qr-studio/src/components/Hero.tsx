import { forwardRef } from 'react'
/** Desktop only. The big wordmark lives in <Header/> and is scrubbed into place by useHeroScroll. */
const Hero = forwardRef<HTMLElement, { depthRef: React.RefObject<HTMLDivElement> }>(({ depthRef }, ref) => (
  <section ref={ref} className="hidden h-[130vh] lg:block" aria-hidden="true">
    <div ref={depthRef} className="sticky top-0 flex h-screen items-end justify-center pb-[14vh]">
      {/* 3D model mount point — drop a lazy-loaded <Canvas/> or three.js scene here */}
      <div id="hero-3d-slot" className="absolute inset-0" />
      <p className="relative max-w-md text-center text-lg text-neutral-600 dark:text-neutral-400">QR codes with a style of their own — and a score for whether they’ll actually scan.</p>
    </div>
  </section>
))
export default Hero
