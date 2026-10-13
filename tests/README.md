# Starboard regression checks

Run the dependency-free state/script checks:

```sh
npm run test:starboard:state
```

Run real Chromium desktop and mobile-touch emulation checks:

```sh
npm install
npx playwright install chromium
npm run test:starboard
```

By default the browser suite starts a temporary local HTTP server for the current
`starboard.html`. To exercise an updated public preview instead:

```sh
STARBOARD_URL=https://your-preview.vercel.app/starboard.html npm run test:starboard
```

The browser suite covers native Tab/Enter/Space, mouse and emulated touch input,
programmatic activation, visible focus, labels, seed/clear/random/harmony state,
real WebAudio oscillator scheduling, tempo, and mobile layout. It does not verify
audible output, a physical phone, or a screen reader. The dependency-free suite
uses a minimal DOM/audio model and cannot establish native browser behavior.

The Starboard accessibility GitHub Actions workflow runs both suites on affected
pull requests. Browser installation failures are failures, not skipped tests.
