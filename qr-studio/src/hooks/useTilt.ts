import { useEffect, type RefObject } from 'react';

/**
 * A restrained pointer tilt (the Vanilla-Tilt idea, without the dependency): a few degrees of perspective
 * that eases back to flat when the pointer leaves. Mouse only; off for touch and reduced motion.
 */
export function useTilt<T extends HTMLElement>(ref: RefObject<T>, maxDeg = 3) {
  useEffect(() => {
    const found = ref.current;
    if (!found) return;
    const node: T = found;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const flat = 'perspective(1100px) rotateX(0deg) rotateY(0deg)';
    node.style.transform = flat;
    node.style.willChange = 'transform';

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = node.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      node.style.transition = 'transform 90ms ease-out';
      node.style.transform = `perspective(1100px) rotateX(${(-py * maxDeg * 2).toFixed(2)}deg) rotateY(${(px * maxDeg * 2).toFixed(2)}deg)`;
    };
    const onLeave = () => {
      node.style.transition = 'transform 360ms cubic-bezier(0.2, 0.7, 0.2, 1)';
      node.style.transform = flat;
    };
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      node.style.transform = '';
      node.style.transition = '';
      node.style.willChange = '';
    };
  }, [ref, maxDeg]);
}
