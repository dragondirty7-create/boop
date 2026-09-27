# BOOP on Netlify

BOOP v0.8 is ready to import from GitHub into Netlify.

## What Netlify runs

- Static BOOP Studio: `index.html`
- Live Cosmo endpoint: `/api/cosmo`
- Function source: `netlify/functions/cosmo.js`
- Local Cosmo fallback remains in BOOP if the network/model is unavailable.

## First deploy

1. In Netlify, choose **Add new project -> Import an existing project**.
2. Connect GitHub and select `dragondirty7-create/boop`.
3. Keep the repository defaults; `netlify.toml` supplies the deploy settings.
4. Deploy to production once.

Netlify AI Gateway becomes available after the first production deploy. It injects the OpenAI API key and base URL into Netlify Functions automatically, so no OpenAI key is required for the default setup.

## Model

Default: `gpt-5.5`

Optional override: set `BOOP_COSMO_MODEL` in Netlify environment variables.

## Privacy boundary

Cosmo receives only BOOP's sanitized musical state. Raw microphone audio is never sent.
