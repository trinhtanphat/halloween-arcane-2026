# Ravenhollow — The Enchanted Halloween 2026

An original, responsive Halloween microsite set in a fictional magical academy. Built on WIN11-181 with **no GitHub Actions**.

## Features
- Original procedural 3D pumpkin with shader-driven fireflies (Three.js), orbit details, manual drag, responsive canvas and WebGL fallback.
- Halloween 2026 countdown, explicitly fixed to **2026-10-31 18:00 UTC+7**.
- Three explorable realms, haunted cemetery and animated spirits.
- Magical portal and a complete three-question mini game with score/badge.
- In-browser fictional invitation; nickname stays in localStorage (never sent to a server).
- Mobile layout, accessible navigation and modal, reduced-motion preference, sound-free experience.
- Plain static site: host on GitHub Pages or Cloudflare Pages without a backend or CI.

## Local development
```powershell
npm ci
npm run build
npx serve -l 4173 .
```

Production entry: `index.html`; static files: `app.js`, `style.css`, `assets/*`, `favicon.svg`.

## Inspiration / attribution
This is an **original standalone implementation**, not a verbatim merger of entire codebases.

1. Halloween Party by Hadil-Ben-Abdallah: https://github.com/Hadil-Ben-Abdallah/Halloween-Landing-Page — creative direction and two original graphical assets; original MIT license retained in `vendor-attributions/party-license.txt`.
2. TresJsHalloweenPumpkin by NeoPrint3D: https://github.com/NeoPrint3D/TresJsHalloweenPumpkin — inspiration for a particle-lit interactive pumpkin. **No third-party source code or original 3D model copied** (the referenced repository has no declared license).
3. Haunted Halloween Landing by Deepakeon: https://github.com/Deepakeon/haunted-halloween-landing — inspiration for modern web layout and two images, MIT license retained in `vendor-attributions/haunted-license.txt`.
4. The Spooky Portal by DMS-Menula: https://github.com/DMS-Menula/spooky-portal — concept inspiration only for an animated interactive portal; no code or art copied.

All additional visuals, CSS effects, graphics, minigame and original arcane-school mythology were made for this project. Magical school theme is fan-inspired; not affiliated with, endorsed by, or licensed by J.K. Rowling, Warner Bros., or the Harry Potter franchise. No Harry Potter characters, logos, book text or brand artwork are included.

## Deployment
GitHub Pages: serve main branch `/ (root)`; direct static site, no build workflow file required. Cloudflare Pages alternative: use Direct Upload or Git integration; output root directory `.` and no framework preset.

## Privacy & performance
The demo is static. The nickname (if submitted) and visual-effects preference remain in browser localStorage. Fonts are served via Google Fonts. The scene uses `requestAnimationFrame` and stops rendering when the tab is hidden; graphics fall back to emoji if WebGL cannot initialize.

## Public demo and smoke tests

- **Live GitHub Pages:** https://trinhtanphat.github.io/halloween-arcane-2026/
- **Source:** https://github.com/trinhtanphat/halloween-arcane-2026
- `npm test` launches a separate headless Chrome using Playwright Core, serves the site temporarily on localhost, verifies the 3/3 challenge, invitation, ghosts, assets and overflow across 320–1440 px, and stores desktop/mobile screenshots under ignored `tests/artifacts/`.
- To smoke-test the public deployment in PowerShell: `$env:SMOKE_URL='https://trinhtanphat.github.io/halloween-arcane-2026/'; npm test; Remove-Item Env:SMOKE_URL`.

No existing interactive Chrome tabs or desktop sessions are modified by the smoke tests.
