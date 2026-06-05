# daily-log

A private, personal health & habit tracker — sleep, movement, nourishment, hydration,
weight, hair care, energy & notes, plus habit streaks. Built with Expo + React Native +
TypeScript and Expo Router, with Supabase for cloud sync and auth.

See [AGENTS.md](./AGENTS.md) for the full project guide and design principles.

## Develop

```sh
npx expo start          # dev server; scan the QR with Expo Go on iPhone
npx expo start --web    # run in the browser
```

## Web build (Vercel)

The app is configured for static SPA export (`web.output: "single"` in `app.json`), so
client-side routing works on a static host.

- **Build command:** `npx expo export -p web`
- **Output directory:** `dist`
- **Routing:** [`vercel.json`](./vercel.json) rewrites all routes to `/index.html` so
  deep links don't 404.

Build locally to verify:

```sh
npx expo export -p web   # produces dist/ with index.html
```

### Required environment variables

Set both in **Vercel → Project Settings → Environment Variables** (they're inlined at
build time, so they must be present when Vercel runs the build). Locally they come from
`.env` (see `.env.example`):

| Variable | Description |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (base, no trailing path) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
