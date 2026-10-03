import { forwardRef, lazy, Suspense, type RefObject } from 'react';
import { ArrowDown, QrCode } from 'lucide-react';

const HeroScene = lazy(() => import('./HeroScene'));

interface Props {
  contentRef: RefObject<HTMLDivElement>;
  modelRef: RefObject<HTMLDivElement>;
  active: boolean;
  onStart: () => void;
}

const Hero = forwardRef<HTMLElement, Props>(function Hero({ contentRef, modelRef, active, onStart }, ref) {
  return (
    <section ref={ref} className="fixed inset-0 z-10 overflow-hidden" aria-label="Introduction">
      <div className="mx-auto grid h-full max-w-6xl grid-cols-2 items-center gap-10 px-10">
        <div ref={contentRef} className="max-w-[30rem]">
          <p className="flex items-center gap-2 font-display text-xl">
            <QrCode className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            QR Studio
          </p>
          <h1 className="mt-10 font-display text-[3.75rem] font-light leading-[1.04] tracking-tight">
            QR codes, made with restraint.
          </h1>
          <p className="mt-6 max-w-[26rem] text-[17px] leading-relaxed text-ink-secondary">
            Make scannable codes for links, text, email, phone and Wi-Fi, then check how reliably they read.
          </p>
          <div className="mt-10 flex items-center gap-5">
            <button type="button" className="btn btn-solid px-6" onClick={onStart}>
              Start a code
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="text-sm text-ink-secondary">or scroll down</span>
          </div>
        </div>
        <div ref={modelRef} className="relative h-[72vh] min-h-[420px] will-change-transform">
          <Suspense fallback={null}>
            <HeroScene active={active} />
          </Suspense>
        </div>
      </div>
    </section>
  );
});

export default Hero;
