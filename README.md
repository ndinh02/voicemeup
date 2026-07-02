# voicemeup

A mobile-first web app for designing a ticket-shaped, voice-note-carrying
message and sending it as a link.

No login, no accounts. Every ticket (drawing, voice note, photo, sender
name, color) is compressed and packed into a single blob; that blob is
either embedded directly in the URL's hash fragment, or uploaded and
swapped for a short id, depending on which link gets sent (see below).

## How it works

- `/` — landing page
- `/create` — design a ticket: pick a color, doodle, record a short voice
  note, take a photo (front/back camera, with a b&w/blur filter), optionally
  add your name
- `/share` — after generating a link, the creator's own confirmation/share
  screen. This still works entirely client-side (no network needed) so
  editing/previewing a ticket has no server dependency.
- `/t/:id` — the short link actually sent to recipients. The encoded blob
  is uploaded to Redis (`api/tickets`) under a random id with a 30-day TTL,
  and the recipient's page fetches it by id. This is what keeps shared
  links short instead of megabytes-long base64 blobs.
- `/t#<data>` — the original self-contained link format, still supported:
  everything needed to render the ticket is in the hash, no server lookup
  at all. Kept as a fallback so sharing still works if the upload fails
  (offline, storage misconfigured, etc.) and so links sent before short
  links existed keep working.

See [src/lib/ticketCodec.ts](src/lib/ticketCodec.ts) for the encode/decode
format, and [src/lib/useTicket.ts](src/lib/useTicket.ts) for how a link is
resolved back into a ticket either way.

### Server-side storage setup

`api/tickets` needs a Redis store reachable via the
[Upstash REST API](https://upstash.com/docs/redis/features/restapi):
from the Vercel dashboard, add a Redis store (Storage → Marketplace →
Upstash) and connect it to this project. The integration names its env
vars `KV_REST_API_URL` / `KV_REST_API_TOKEN` (a holdover from the old
Vercel KV branding) — that's what `api/tickets` reads. Run
`vercel env pull .env.development.local --environment=preview` to get the
same vars locally (the integration only provisions Production/Preview by
default, not Development). If these aren't set, short-link creation fails
and sharing silently falls back to the long self-contained `/t#<data>`
link — nothing breaks, links are just long again.

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

Deployed on Vercel: `npm run build` produces the static `dist/` frontend, and `api/tickets/` are Vercel serverless functions backing short links (see "Server-side storage setup" above — without them configured, the app still works, it just falls back to long self-contained links). `vercel.json` has SPA-fallback routing and security headers (CSP, clickjacking protection) already set up.

The app can still be deployed to a plain static host (e.g. Netlify via `public/_headers` + `public/_redirects`) if you don't need short links — short-link creation will fail closed and every link will just be the long `/t#<data>` form.

