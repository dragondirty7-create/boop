# Rhythm Rush

BOOP Arcade rhythm game.

## Provenance

- Gemini created the original Rhythm Rush Canvas prototype.
- The Drive export preserved only a small React shell.
- This branch preserves that shell in `RhythmRush.jsx` and adds a new mobile-first playable MVP in `index.html`.
- The playable MVP is a rebuild, not a claim to have recovered the missing Canvas mechanics.

## Mobile goals

- phone-first layout using `100svh` and safe-area insets
- large touch targets
- no hover dependency
- keyboard fallback (1–4)
- no account, cookies, analytics, or personal data
- reduced-motion friendly

## Next passes

Soul and Claude should alternate review passes. Keep changes small, playable, and reversible. Do not rewrite BOOP's main app from this experiment branch until the game is tested on an actual phone.
