import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import anime from 'animejs';

export type Phase = 'hero' | 'toWorkspace' | 'workspace' | 'toHero';

/** Starting values, tuned by feel. Forward is deliberately cheap, backward deliberately expensive. */
export const HERO_TUNING = {
  forwardWheel: 100, // px of wheel delta to leave the hero
  backWheel: 700, // px of *sustained* upward wheel delta, at the top of the workspace, to return
  forwardTouch: 50,
  backTouch: 220,
  idleResetMs: 300, // a pause this long throws away a half-finished gesture
  settleMs: 450, // input ignored after a transition, so trailing inertia can't re-trigger
  topSettleMs: 350, // after leaving scrollTop > 0, upward scroll can't count toward "back"
};

interface Opts {
  enabled: boolean;
  hero: RefObject<HTMLElement>;
  model: RefObject<HTMLElement>;
  content: RefObject<HTMLElement>;
  workspace: RefObject<HTMLElement>;
}

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isField = (t: EventTarget | null) => t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);

/**
 * Hero <-> workspace as two discrete, locked steps driven by scroll *intent* (wheel/touch delta),
 * not scroll position. Both layers are fixed to the viewport, so there is no spacer to collapse.
 */
export function useHeroScroll({ enabled, hero, model, content, workspace }: Opts) {
  const [phase, setPhaseState] = useState<Phase>(enabled ? 'hero' : 'workspace');
  const phaseRef = useRef<Phase>(phase);
  const lockUntil = useRef(0);
  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // Establish the resting state for the current layout (desktop intro vs. mobile workspace-only).
  useLayoutEffect(() => {
    const h = hero.current;
    const m = model.current;
    const c = content.current;
    const w = workspace.current;
    if (!enabled) {
      // Mobile / narrow: no intro. The hero is not even mounted, so only the workspace needs revealing.
      if (h) h.style.display = 'none';
      if (w) {
        w.style.transform = '';
        w.style.opacity = '1';
        w.style.visibility = 'visible';
        w.style.pointerEvents = 'auto';
        w.removeAttribute('inert');
      }
      setPhase('workspace');
      return;
    }
    if (!h || !m || !c || !w) return;
    for (const el of [m, c, w]) el.style.transform = '';
    m.style.opacity = '1';
    c.style.opacity = '1';
    h.style.display = '';
    h.style.visibility = 'visible';
    h.style.pointerEvents = 'auto';
    h.removeAttribute('inert');
    w.style.opacity = '0';
    w.style.visibility = 'hidden';
    w.style.pointerEvents = 'none';
    w.setAttribute('inert', '');
    w.scrollTop = 0;
    setPhase('hero');
  }, [enabled, hero, model, content, workspace, setPhase]);

  const goForward = useCallback(() => {
    const h = hero.current, m = model.current, c = content.current, w = workspace.current;
    if (!h || !m || !c || !w || phaseRef.current !== 'hero') return;
    setPhase('toWorkspace');
    const quick = reduced();
    const d = (ms: number) => (quick ? 1 : ms);
    w.style.visibility = 'visible';
    w.removeAttribute('inert');
    anime
      .timeline({
        easing: 'easeInOutCubic',
        complete: () => {
          h.style.visibility = 'hidden';
          h.style.pointerEvents = 'none';
          h.setAttribute('inert', '');
          w.style.pointerEvents = 'auto';
          w.style.transform = '';
          lockUntil.current = performance.now() + HERO_TUNING.settleMs;
          setPhase('workspace');
          w.focus({ preventScroll: true });
        },
      })
      // 1. The 3D code leads: it slides off to the right, fading as it goes.
      .add({ targets: m, translateX: ['0vw', quick ? '0vw' : '55vw'], opacity: [1, 0], duration: d(520) }, 0)
      // 2. The remaining hero copy follows, overlapping but not in lockstep.
      .add({ targets: c, translateY: [0, quick ? 0 : -14], opacity: [1, 0], duration: d(380) }, d(180))
      // 3. Once the hero is clear, the workspace arrives.
      .add({ targets: w, translateY: [quick ? 0 : 18, 0], opacity: [0, 1], duration: d(380) }, d(540));
  }, [hero, model, content, workspace, setPhase]);

  const goBack = useCallback(() => {
    const h = hero.current, m = model.current, c = content.current, w = workspace.current;
    if (!h || !m || !c || !w || phaseRef.current !== 'workspace') return;
    setPhase('toHero');
    const quick = reduced();
    const d = (ms: number) => (quick ? 1 : ms);
    h.style.visibility = 'visible';
    h.removeAttribute('inert');
    w.style.pointerEvents = 'none';
    anime
      .timeline({
        easing: 'easeInOutCubic',
        complete: () => {
          w.style.visibility = 'hidden';
          w.setAttribute('inert', '');
          w.scrollTop = 0;
          h.style.pointerEvents = 'auto';
          lockUntil.current = performance.now() + HERO_TUNING.settleMs;
          setPhase('hero');
        },
      })
      .add({ targets: w, opacity: [1, 0], translateY: [0, quick ? 0 : 10], duration: d(300) }, 0)
      .add({ targets: m, translateX: [quick ? '0vw' : '55vw', '0vw'], opacity: [0, 1], duration: d(520) }, d(220))
      .add({ targets: c, translateY: [quick ? 0 : -14, 0], opacity: [0, 1], duration: d(380) }, d(360));
  }, [hero, model, content, workspace, setPhase]);

  // Input intent.
  useEffect(() => {
    if (!enabled) return;
    const T = HERO_TUNING;
    let fwd = 0, back = 0, lastWheel = 0, lastAwayFromTop = 0, touchY = 0, touchAtTop = false;
    const ws = workspace.current;

    const onScroll = () => {
      if (ws && ws.scrollTop > 0) lastAwayFromTop = performance.now();
    };

    const onWheel = (e: WheelEvent) => {
      const ph = phaseRef.current;
      const now = performance.now();
      if (ph === 'toWorkspace' || ph === 'toHero') return e.preventDefault();
      if (now < lockUntil.current) {
        if (ph === 'hero') e.preventDefault();
        return;
      }
      if (now - lastWheel > T.idleResetMs) fwd = back = 0;
      lastWheel = now;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;

      if (ph === 'hero') {
        e.preventDefault();
        fwd = dy > 0 ? fwd + dy : 0;
        if (fwd >= T.forwardWheel) {
          fwd = 0;
          goForward();
        }
      } else if (ph === 'workspace' && ws) {
        if (ws.scrollTop > 0) lastAwayFromTop = now;
        const settled = ws.scrollTop <= 0 && now - lastAwayFromTop > T.topSettleMs;
        if (!settled || (e.target instanceof HTMLElement && e.target.closest('textarea'))) return void (back = 0);
        back = dy < 0 ? back - dy : 0;
        if (back >= T.backWheel) {
          back = 0;
          goBack();
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchAtTop = !!ws && ws.scrollTop <= 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const ph = phaseRef.current;
      if (ph === 'toWorkspace' || ph === 'toHero') return e.preventDefault();
      if (performance.now() < lockUntil.current) return;
      const dy = touchY - e.touches[0].clientY;
      if (ph === 'hero') {
        e.preventDefault();
        if (dy > T.forwardTouch) goForward();
      } else if (ph === 'workspace' && touchAtTop && -dy > T.backTouch) {
        goBack();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'hero' || isField(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goForward();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKey);
    ws?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      ws?.removeEventListener('scroll', onScroll);
    };
  }, [enabled, workspace, goForward, goBack]);

  return { phase, goForward, goBack };
}
