# voicemeup

A mobile-first web app for designing a ticket-shaped, voice-note-carrying
message and sending it as a link.

No login, no accounts, no database for the ticket itself. Every ticket
(drawing, voice note, sender name, color) is compressed and packed into the
URL's hash fragment, so a link is the entire ticket — there's nothing to
look up on a server, and nothing ever leaves the browser except when the
recipient opens the link.

## How it works

- `/` — landing page
- `/create` — design a ticket: pick a color, doodle, record a short voice
  note, optionally add your name
- `/share` — after generating a link, the creator's own confirmation/share
  screen
- `/t#<data>` — the recipient's view; everything needed to render the
  ticket is in the hash

See [src/lib/ticketCodec.ts](src/lib/ticketCodec.ts) for the encode/decode
format.

## Development

```bash
npm install
npm run dev
```

```bash
npm run lint      # oxlint
npm run build     # tsc -b && vite build
```

## Deployment

This is a fully static site (no backend, no database, no env vars) — `npm run build` produces a `dist/` folder that any static host can serve. `vercel.json` and `public/_headers` + `public/_redirects` are already set up with SPA-fallback routing and security headers (CSP, clickjacking protection) for Vercel and Netlify respectively; pick whichever host and connect the repo, no extra config needed.

