# Crypto Meme Smash

A browser-only React / Vite arcade game using Canvas, GSAP and Zustand. All 25 supplied creatures are extracted into `src/assets`. Original artwork and the ZIP are preserved.

```sh
npm install
npm run dev
npm test
npm run build
```

Deploy `dist/` to any static host. No backend, environment variables or API keys are required. Web fonts are optional; system fallbacks work offline. Sound is synthesized locally with Web Audio.

Click **Let’s smash** to start. Attack creatures with the hammer (2 damage) or pop gun (1 damage, 6 shots). Switch with 1/2, reload with R, pause with Space. Keyboard-accessible attack buttons are revealed on focus below the toolbar. Rounds last 30, 60 or 90 seconds. Settings, discoveries, character statistics, highest combo and the top 10 scores persist in this browser. Unavailable storage is reported without interrupting play.

Six random events begin 12 seconds into a round and repeat every 18 seconds, lasting 8 seconds. Combos expire after 2.8 seconds or a missed shot. Reward base tiers have weights 65/24/8/2.7/0.3, with rarity and moon events improving higher-tier odds. Damage, combos and event multipliers affect final payouts. Arcade dollars have no real value and cannot be transferred to wallets.

Wallet discovery uses `@wallet-standard/app` and `standard:connect`, `standard:disconnect`, and `standard:events`, prioritizing Phantom and Solflare. Only public accounts are requested, with no signing or transaction features. A compatible installed browser extension is required to test an actual connection.

## Verification

`npm test` checks reward boundaries, combo thresholds, collision detection and collapse positions. Browser integration tests: `npx playwright test` (the tests start their own server on port 5185; Chromium must be available). No Three.js is used: Canvas provides the needed cartoon depth without an additional renderer.

## If the Start button seems stuck

Open the URL printed by `npm run dev` (normally `http://localhost:5173`), then refresh the page to load the latest code. Opening `index.html` directly from the filesystem does not run a Vite application.

Gameplay continues without audio when Web Audio cannot initialize. If browser storage is blocked or full, a warning appears and the round remains playable, but progress cannot be saved. The storage error is reported once to avoid repeated save attempts freezing the page.

Sprite background removal uses a bounded queue, palette filtering runs once during loading, and unchanged menu/pause screens are not redrawn every frame. Unchanged saved data is not written to localStorage again.
