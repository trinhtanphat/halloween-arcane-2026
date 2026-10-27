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

## First-person castle courtyard (WASD, touch and portal interaction)

- Added a genuine first-person camera mode to the existing opt-in Three.js castle tour. Visitors explicitly activate 3D, then press "ĐI BỘ WASD" to enter the courtyard.
- The courtyard is original procedural geometry with a paved path and four glowing runic gateways. No third-party 3D meshes or extra download services are needed.
- Keyboard: W/A/S/D to move, arrow keys to walk/turn, drag/touch to look, and E to enter a nearby gateway. Accessible on-screen mobile controls provide directional steps, turning, and a proximity-gated portal interaction button.
- Movement is bounded to a courtyard, keeping the camera outside the castle's solid walls and away from the edges. The nearby-gateway indicator provides text guidance.
- Switching back to the original orbit camera, switching off WebGL, or losing graphics support preserves the existing interactive 2D room selector, four relic quests and seven passport achievements.
- FPS throttling, hidden/offscreen rendering pauses, and disposal of Three.js geometry/materials remain in place; no movement continues after keyboard focus leaves the canvas.
- Automated browser checks cover movement via W and on-screen controls, turning, portal entry, boundary collision, mode switch and 2D fallback.
- Offline service-worker cache v11 refreshes the modified bundled app.js, castle-tour.css and index.html.

## Four explorable 3D castle interiors — Chapter XIII

The four courtyard gateways lead into distinct, original indoor Three.js scenes: a candlelit Great Hall, the Enchanted Library with shelves and levitating pages, a Moon Tower with telescope and orrery, and an Ancient Crypt with sarcophagi and glowing seals. Each interior is built from code-generated geometry (no external 3D files), has walls and furniture collision, and a luminous relic near the back of the chamber.

From first-person courtyard mode, approach any glowing gateway and press E or VÀO CỔNG to enter its indoor scene. Navigate with WASD, arrows or touch controls. Reach the glowing relic and press E to open the *existing* corresponding expedition riddle. The separate RỜI PHÒNG control returns the visitor to the courtyard at their previous location; panorama view and 2D fallback still work. Four pre-existing relic quests and all seven Arcane Passport stamps persist unchanged.

When switching interiors or returning outdoors, indoor geometries and materials are explicitly disposed. Offline PWA cache v12 refreshes the bundled geometry and visuals. The browser regression test covers each of the four indoor scenes, returning to the courtyard, reaching a relic, collision limits, keyboard E interaction, GPU fallback, old quests and mobile layouts.

## Immersive in-room relic puzzles (Chapter XIV)

When exploring an interior in first-person WebGL, approach its luminous relic and press **E** or the action control. The new, accessible native HTML dialog displays the exact existing expedition story, question and three choices **without navigating away from the 3D scene**. On keyboard, **1–3** choose answers and **Esc** closes the dialog. Buttons are touch-friendly with distinct right/wrong states and screen-reader feedback.

The dialog does not own a second answer list or progress store. Instead it mirrors the already installed `expedition.js` controls and clicks the canonical answer, preserving all four relics, existing `localStorage` progress, vault unlock, passport badges, and replay. Wrong answers do not grant a relic; correct answers make the matching 3D crystal glow green. Reopening a previously completed challenge displays the earned relic as read-only. Movement is frozen while the dialog is open and returns on close. WebGL fallback and 2D quests remain functional.

Service worker cache v13 refreshes the new interface. Regression tests verify the dialog, wrong answer, correct answer, saved progress, close/return controls, all four rooms and legacy quests.

## Forgotten Vault 3D finale — Chapter XV

The Ravenhollow courtyard now includes an original procedural **3D treasure chest** behind the player's spawn area. It displays three visually distinct states: locked (fewer than four relics), ready (all four), and opened (the chest lid animates and the seal emits green light). The altar can be activated when close using **E**, a pointer click on its crystal or the on-screen interaction control. A dedicated "KHO BÁU CUỐI CÙNG" control also provides a keyboard/touch-accessible dialog from 2D, while preserving the original expedition's accessible 2D vault button.

The treasury dialog lists all four canonical relics and marks which were earned; unlocking is disabled until all four are collected. On unlock, it clicks the *existing* #vault-open action, which remains the single source of truth for the existing localStorage key, vault achievement, and all seven Arcane Passport stamps. In 3D the original quest no longer scrolls the page away from the immersive scene. Dialog close/return retains the camera and progress, and the fallback 2D vault remains supported.

The updated Playwright smoke suite checks the locked dialog, 0/4 and 4/4 relic state, the courtyard proximity trigger, keyboard E, unlocking via the 3D dialog, and the existing vault localStorage + passport side effects, as well as all old games, responsive widths, and PWA offline. PWA cache v14 refreshes the update.

## Chapter XVI — Secret Crown Chamber (3D)

The opened courtyard treasure chest now unlocks a **walkable secret 3D throne room**. Visitors who earned all four relics and completed the canonical Forgotten Vault can enter using the "BƯỚC VÀO MẬT THẤT 3D" control in the vault dialog, or by approaching the already-open chest and pressing E. The chamber is available only with an activated Three.js WebGL walk session; the original 2D victory remains accessible on devices without WebGL.

Original offline geometry includes rune-inlaid stone floor, six gothic pillars, four relic shrines, a torchlit raised dais, and a rotating seven-spired crown. WASD, keyboard turning, touchscreen movement, collision handling and the "RỜI MẬT THẤT" exit all reuse the existing controls. Near the crown, press E or tap its mesh to open the accessible cinematic finale (personalized using the existing local invitation nickname; no new personal data storage). Escape returns to the 3D chamber. Exiting restores the prior courtyard position, and subsequent entry is supported.

Chamber meshes/materials are disposed when leaving; no extra Three.js dependency or external files are downloaded. Existing seven Passport achievements and four relics are unchanged. WebGL disabled/fallback continues to show the original quest ending. Smoke tests cover locked/ready/unlocked gating, entry, crown proximity and E, finale, exit/re-entry, responsive screens and offline PWA cache v15.

## Chapter XVII — Interactive Quest Compass / Minimap

A live, top-down local Canvas minimap now accompanies first-person 3D castle exploration. It draws the player's world position and facing arrow, a dotted route to the current objective, available room gateways, collected room stamps, and the courtyard treasure chest. It displays a true relative orientation cue (front, behind, left, right or diagonals), approximate distance in **in-game units** (not meters), and current objective progress. No geolocation or map API is involved.

On the courtyard, guidance automatically prioritizes uncollected relic rooms and then the vault. Players can click **ĐỔI MỤC TIÊU** to cycle among four rooms and the chest; choosing a named room also sets the objective. On entering a room, the destination becomes its relic. Entering the secret chamber redirects to the crown. The map updates to each zone's own bounded coordinate system, works with WASD, keyboard turning and touch controls, and automatically resets when leaving a room or switching to 2D. Already-earned relics get distinct marks. Quest state comes directly from the original expedition's DOM; no duplicate persistence or navigation data.

The self-contained 2D renderer is independently throttled to about 10 frames per second and doesn't create another WebGL context or request any remote assets. PWA cache v16 updates the existing app.js bundle and castle-tour styles.

Browser tests cover map visibility, directional guidance, manual objective cycling, position tracking during WASD, room and chamber re-targeting, previously collected progress, WebGL-fallback invisibility, old relic quests and all existing minigames.

When an additional relic is collected, the compass automatically clears an earlier manual destination and recommends the next incomplete room; after all 4/4 relics it points to the vault. Players can still manually cycle to previously visited rooms after completion.

## Chapter XVIII — Mobile controls & reliability hardening (release readiness)

The mobile direction pad now supports **press-and-hold** to walk or turn continuously. A quick tap still moves exactly one 0.7-unit step; held movement begins only after a short 170 ms threshold, uses the same collision limits as keyboard WASD, and does not add a duplicate step when the pointer releases. Multiple touch pointers can combine forward/strafe actions. Buttons show a visible pressed state, disable default touch scrolling while held, and respect reduced-motion preferences.

Keyboard and touch states are cleared on zone transitions, modal openings, view-mode changes, 3D shutdown, window blur and visibility loss, preventing stuck movement after interruptions. If a pointer is cancelled, its held input is removed; a new press resets its click-suppression state. Neither the canonical quests nor localStorage progression is modified.

Regression tests exercise long press, release (must stop), single-step taps, loss-of-focus cancellation, collision limits, all four 3D interiors, crown chamber, responsive viewports, WebGL loss fallback and offline PWA. Cache v17 refreshes the bundled controls and CSS.

## Release QA — saved-progress integrity and WebGL lifecycle (Chapter XIX)

- Fixed a real save-game integrity failure: the persistent vault-open flag could survive a partial/corrupted restore while fewer than four canonical relics existed, incorrectly showing the grand finale and passport vault achievement. The expedition now validates all four distinct known room relics before accepting the saved ending and clears an orphaned completion flag.
- The Arcane Passport independently validates its vault stamp against the same four canonical relic IDs, so script load timing or partial restore cannot award an incorrect stamp.
- Fixed a second restore failure in the 3D UI: the Three.js tour module can initialize before the deferred expedition module restores saved data, displaying a locked 3D chest even when a full valid save is present. Reconciliation on page load now synchronizes chest state, waypoint navigation and progress after all deferred modules complete.
- Added npm run test:reliability (tests/reliability.mjs), a standalone isolated-browser regression suite covering invalid/valid saved state and reload, corrupt JSON recovery, four real WebGL start/stop + room-entry cycles, and simulated castle WebGL context loss with working 2D fallback. Uses a separate headless Chromium instance and does not attach to existing Chrome tabs.
- Retains npm test as the full gameplay, responsive, PWA/offline and achievement smoke suite; cache version v18 updates the changed expedition, passport, and bundled Three.js scripts.

Result definition: no failures detected in the documented tested scope — not a guarantee that every GPU, OS, browser version or assistive technology has been exhaustively certified.
