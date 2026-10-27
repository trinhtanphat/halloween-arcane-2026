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

## Expansion: The Four Orders, Spellbook and offline mode

- **Four Arcane Orders:** 3-step personality game, four original magical groups (Solaris, Noctis, Aetheris, Verdantia), live result and replay. Result saved only in localStorage.
- **Interactive Spellbook:** Luminara, Nebulora, Asterium and Florastra; original CSS chamber, animated particles, semantic button selection and accessible status text. Honors motion-reduction preference.
- **Offline-first static content:** scoped PWA service worker caches core assets so the site works offline after a completed first load. Fonts may fall back while offline. Versioned cache is network-first and automatically replaces outdated app assets.
- **Install support:** application manifest with 192×192 and 512×512 original app icons. Availability of the install prompt depends on the browser/platform.
- **3D interactions:** arrow-key rotation and pointer dragging; WebGL-disabled environments automatically show an illustrated fallback instead.
- **Smoke tests:** include new quiz and spells, 12 public/static resources, viewport tests, service-worker readiness, and offline navigation. Automated tests launch an isolated headless Chrome process; never control existing browser tabs.

Commands: \`npm ci\`, \`npm run build\`, then \`npm test\`. The deployed \`app.js\` is compiled from \`src/main.js\`; the new \`magic.js\` is a separate dependency-free browser module. GitHub Pages serves both from the repository root without GitHub Actions.

## Alchemist's Journey, Passport and discoverability

- **Potion Laboratory:** Three original recipes, six selectable ingredients, wrong-recipe reset, success/failure feedback, replay and local-only alchemist achievement.
- **Arcane Passport:** Four achievements from the Sorting Ceremony, all four spells, the 3-question portal challenge and all three potion recipes. Shared progress is refreshed using in-page `ravenhollow-progress` events and read from browser localStorage; no backend, analytics or account required.
- **Share progress:** One click copies a plain-text achievement summary if the Clipboard API is available, otherwise a clear browser-specific fallback message appears.
- **Accessibility:** Clearly labeled ingredient controls, toggle states, live puzzle feedback, responsive grids, keyboard-friendly buttons and reduced motion support.
- **SEO:** Canonical URL, Open Graph/Twitter metadata and a repository-scoped XML sitemap. GitHub Pages serves this site at a subpath; robots.txt rules require host-root control to govern crawlers site-wide.
- **Offline cache:** `sw.js` cache version v4 includes the Potion Laboratory CSS/JS. Core files are available offline after an initial successful install. When online, network responses take priority so new site versions can update.
- **Automated checks:** `npm run build` and `npm test`; smoke tests cover incorrect and correct recipes, progress 4/4, offline reload, public resources and five mobile-to-desktop widths.

Open the public demo: https://trinhtanphat.github.io/halloween-arcane-2026/ .

## The Ravenhollow Castle Expedition

A new original, independent mystery adventure complements the party, academy, portal and alchemy:
- **Four explorable castle rooms:** the Great Hall, Lost Library, Moon Tower and Ancient Crypt, each with a distinct visual scene, story, riddle and collectible.
- **The Forgotten Vault:** answering each room's riddle adds one relic, and collecting all four unlocks the final treasure. Incorrect responses provide feedback and allow retries.
- **Saved progress:** relics and vault completion stay in browser localStorage; replay clears only expedition progress, not the separate academy achievements.
- **Arcane Passport now 5/5:** the optional treasure-hunter badge is awarded only when the vault itself opens; the existing four achievements are preserved.
- **Offline v5:** includes the new expedition scripts, styles and previously licensed imagery.
- **Browser smoke tests:** wrong-answer recovery, four-room treasure unlock, five achievements, service-worker offline reload and responsive layouts. No GitHub Actions needed.

These are fictional story scenarios, not real Halloween event bookings or licensed Harry Potter locations.

## Resilient 3D pumpkin and opt-in soundscape

- Accurate renderer state: the hero reports real WebGL or GPU-free 2D fallback. The fallback is an original CSS pumpkin illustration, not a generic emoji.
- WebGL failure protection: if the graphics context cannot be created or is lost, the page continues in 2D with an accurate status label.
- Better performance: device pixel ratio capped at 1.25 on small screens and 1.5 otherwise, frame pacing at 30/50 FPS, and offscreen/hidden-tab frame skipping. Correct GLSL smoothstep edge ordering.
- Accessible controls: arrow-key rotation for 3D pumpkin, image description for fallback, existing reduced-motion handling.
- Opt-in audio ambience: footer button starts a quiet original synth soundscape after a user click using WebAudio; no automatic audio, downloads, login or tracking.
- Smoke tests check renderer mode, forced WebGL unavailability, optional WebGL context-loss extension, sound/effects switches, offline use, quizzes and mobile widths.
- Offline cache v6 includes CSS fallback and soundscape JS.

Graphics acceleration is browser/device-specific; passing headless Chromium WebGL tests does not verify all physical GPUs.

## Moonlight Candy Hunt and sixth achievement

- **Five-lane Candy Hunt minigame:** Ten untimed turns, keyboard/touch/mouse controls, collectible candy and ghost hazards. No ads or server leaderboard. Pick a lane and press Collect or Space from the focused board.
- **Accessible controls:** Arrow keys, lane buttons, large mobile controls, live text feedback; no time limit or required reflexes.
- **Achievement progression now 6/6:** Collect at least 6 candies to unlock the Sweet Hunter badge. Existing five badges are retained. Highest score and unlocked badge are stored only in localStorage.
- **Offline:** PWA service worker v7 caches the new game files.
- **QA:** Browser tests cover ghost collision, ArrowLeft/Space input, ten-turn victory, 6/6 badge, high-score replay, 20 static resources, offline reload and regressions.

The game is original, fictional and browser-only; no login, purchases or analytics.

## Halloween Invitation Atelier — personalized PNG cards

- **Three original invitation themes:** Moonlit Purple, Pumpkin Ember, Enchanted Forest.
- **Client-side vector artwork:** A canvas renders a detailed 900×1200 card containing the Ravenhollow castle, moon, magical framing, pumpkins, event date and visitor nickname; no images are fetched by the renderer.
- **PNG export:** Download your own invitation as a 900×1200 PNG with a sanitized filename; the app verifies the nickname is at least two characters before downloading.
- **Name synchronization:** The original invitation input and poster designer share the same browser-local nickname. The selected palette is saved to localStorage.
- **Sharing:** Copy a human-readable invitation and link using Clipboard API where browser permissions allow.
- **No signups or hosting costs:** Drawing, preview and exporting are entirely on the user's device, with no backend upload, telemetry, accounts or ticket sales.
- **Offline PWA v8:** Pre-caches poster.js and poster.css alongside the existing site.
- **Automated QA:** Verify each design palette changes pixels, nickname synchronization, invalid input, actual downloadable PNG magic bytes and dimensions, offline preview, all previous minigames and 320–1440px responsive views.

The virtual Halloween date is 31 October 2026, 18:00 in GMT+7; the website is a fictional online experience, not a real-world ticketed gathering.

## Ancient Rune Memory — Chapter XII

- Original memory matching minigame: 6 pairs (normal) or 8 pairs (advanced), randomly shuffled, untimed, touch-and-keyboard friendly.
- Each card is a native button with hidden/revealed/matched screen-reader labels and Enter/Space support; mismatched pairs remain visible briefly before flipping back.
- Best move counts are tracked separately per difficulty in browser localStorage, and can be replayed without losing unlocked achievements.
- Completing at least six pairs grants the seventh Arcane Passport stamp, the Memory Keeper. All six existing achievements are preserved.
- The offline PWA cache (v9) now includes the new rune CSS/JS.
- Automated tests cover a deliberate mismatch, its timed reset, keyboard-driven matching, victory, best score persistence and replay at both normal and hard difficulty, all earlier site features and offline rendering.

The game is fiction and is fully client-side. No account or server endpoint is used for player data.

## Procedural Interactive Castle Tour — opt-in Three.js 3D

- Four-room castle tour integrated into the existing relic expedition, including the Great Hall, Lost Library, Moon Tower and Ancient Crypt.
- The real-time 3D scene is original geometry (stone keep, five turret roofs, illuminated windows, an arched gate, magical floating room orbs, moon and glowing braziers) produced by the already installed Three.js dependency. No additional remote models or textures.
- **Opt-in performance:** 3D stays off until the player clicks Activate 3D. Frame rate is capped at 25 fps on phones / 36 fps elsewhere; the renderer is skipped in hidden/offscreen tabs and disposed when switched off.
- **Interaction:** Drag, touch, wheel, arrow keys, accessible rotate/zoom buttons, and the four named room selectors. Click/tap a glowing orb to focus on a room; Enter Selected Room synchronizes with the original riddles and preserves relic progress.
- **WebGL-safe:** Gracefully uses an original CSS-illustrated castle when WebGL is disabled or lost. The room selector and all riddles remain available in 2D, with truthful mode labels.
- **Offline PWA:** service worker cache v10 includes castle-tour.css; the bundled app.js contains the new procedural Three.js module.
- **Automated tests:** confirm the 3D launch and teardown, arrow-key orbit controls, zoom, 2D-only fallback, integration with room selection, offline mode, and all existing quests.
