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

## Local competition and surprises

The collapsible leaderboard ranks up to ten named players who take turns in this browser. Use **Your player** to rename yourself, choose a creature avatar, or create/select another player between rounds. Top Smashers shows the leading three players, their winnings, best combo and destroyed blocks for the selected period. Ten labeled demo rivals fill out the board alongside real local players. Their preset daily, weekly and all-time scores are display-only; they never enter saved results or the activity feed. No online player counts are claimed.

Winnings are saved on each hit in local-calendar-day buckets. Daily means today; weekly means Monday through today; all-time sums all recorded days. A round crossing midnight contributes to each day as hits happen. Finishing a round does not add those winnings again. Existing saved top-ten round records migrate once to the initial player; older rounds discarded by the previous version cannot be recovered. Personal records and original saved round history are retained. Storage is per browser, with no cross-device or simultaneous-tab synchronization.

Lucky blocks add $250; mystery blocks reveal $500 or eight seconds of Golden Hammer (4 hammer damage). Jackpot blocks add $2,500. Specials occur on 16% of spawned blocks, including 2.5% jackpot blocks. Three angry characters may dodge once; attack their new location or wait a second for their return. Lower-block destruction sends neighboring blocks falling and wobbling. Existing combo rush multipliers, market events and weapon controls remain. Power-up timers pause with the round.

Activity comes only from actual local wins, jackpots, combo milestones, power-ups and block milestones. At most four entries appear and expire after twelve seconds. `src/store/competition.js` exposes the ranking functions and validated activity contract; `receiveActivity` is the feed ingestion point for a future genuine multiplayer transport. No transport or remote records are generated. A future integration must verify identity and rewards before ingestion.

Additional checks cover calendar/year boundaries, migration, immediate ranking updates, feed expiry, profile persistence, special rewards, Golden Hammer expiry, revenge dodges, and stack collapse.

The optional **Demo parade** is a scrolling, explicitly fictional set of player winnings, separate from both rankings and actual activity. It can be paused and respects reduced motion. The toolbar music button enables the existing synthesized soundtrack during play; the adjacent sound button controls hit effects. **Story & how to play** opens a four-chapter interactive guide with a working weapon choice. No audio files or new dependencies are required.
