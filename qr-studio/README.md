# QR Studio

React + TypeScript + Vite. Minimal / editorial, beige-brown neutrals, no accent colour.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks, then bundles to dist/
```

Deploys as-is to Vercel or Netlify (build command `npm run build`, output `dist`).

## Where to tune things
- Scroll thresholds and settle times: `HERO_TUNING` in `src/hooks/useHeroScroll.ts`
- Transition timings: the `.add({... duration})` calls in the same file
- Palette tokens (light and dark): `:root` and `.dark` in `src/index.css`
- Style presets, their parameters and brand mapping: `src/presets/index.ts`
- Rendering of each preset: `src/qr/renderer.ts`
