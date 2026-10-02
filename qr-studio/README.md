# QR Studio

A browser-only QR code generator and design tool — React + TypeScript + Vite.

## Setup

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

## Build for deployment

```bash
npm run build
```

Output goes to `dist/` — deploy that folder directly to Vercel or Netlify (or connect the repo and let either platform run `npm run build` for you, output directory `dist`).

## What's implemented

- 5 QR types (URL, Text, Email, Phone, Wi-Fi) with per-type validation
- Live preview, no "Generate" button
- Universal controls: size, foreground/background, error correction (L/M/Q/H), margin
- 9 style presets across 3 groups (Structural / Vivid / Textured), each with unique adjustable parameters, fully editable after selection
- Logo system: none / center / full-fade, with error correction auto-locked to Q/H when active
- Brand palette: derive accent colors from 1–2 hex inputs
- PNG download (pixel-matched to preview) and SVG download (all presets except Glass Panel, which requires live blur context)
- Copy-to-clipboard for the QR payload
- Scan reliability scoring: contrast, error correction, quiet zone, logo coverage
- Recent QR codes in localStorage (capped at 10, oldest evicted), with reuse and delete
- Dark/light/system theme, persisted
- Responsive single-column layout on mobile

## A few things worth knowing before you test

- **This project was written but not run in the build environment** (no network access there to `npm install`). Dependency versions in `package.json` are pinned to versions that existed at time of writing — if `npm install` reports a version conflict, relax the affected version range in `package.json` and reinstall.
- **Glass Panel + SVG**: the export button is disabled for this one preset by design, with an on-screen explanation — this isn't a bug.
- **Clipboard copy** requires a secure context (works on `localhost` and any HTTPS deploy; will silently fail if you ever open the built file directly via `file://`).
- Manual test pass still needed against the assignment's testing checklist (all 5 types, invalid inputs, download-matches-preview, refresh persistence, mobile viewport) — I can't run a real browser here to do that for you.
