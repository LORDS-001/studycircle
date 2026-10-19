# StudyCircle web

The StudyCircle frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and Radix primitives.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Open the app, choose **Get started**, and sign in with any email (or the Google button). The demo signs you in as Ada, an organiser with two groups, past and upcoming sessions, a question bank and chat history. **Reset demo data** in the account menu restores everything.

## How it's put together

| Path | What lives there |
| --- | --- |
| `src/app/page.tsx` | Landing page |
| `src/app/login`, `onboarding`, `invite/[code]` | Auth, onboarding and invite links (outside the app shell) |
| `src/app/(app)/…` | Signed-in app: dashboard, courses, groups (overview, sessions, availability, questions, notes, chat, members), session page, settings |
| `src/app/sessions/[sessionId]/live` | Session Mode, full screen |
| `src/components/ui` | Design-system primitives: Button, Field, Badge, Avatar, Dialog (bottom sheet on phones), menus, Select, Switch, Segmented, Tabs, Panel… |
| `src/components/brand` | Logo, mark, loader, and the ring visuals (`SeatRing`, `StepRing`) |
| `src/components/app` | Product components shared across screens |
| `src/lib` | Types, data store, read hooks, session templates, formatting helpers |

### Design tokens

All colour, type and motion tokens are in `src/app/globals.css`, taken from the brand guidelines:

- **Scholar palette:** cream canvas (`bg-background`), deep blue structure (`text-foreground`, `bg-primary`), teal for progress (`bg-teal`, `text-teal-text`), gold for celebrations only (`bg-gold`). Every token has a dark-mode value.
- **Type scale:** `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small`, `text-label`, matching the six brand sizes. Plus Jakarta Sans throughout.
- **Motion:** custom ease-out curves (`--ease-out`, `--ease-drawer`), `pressable` for press feedback, and reduced motion respected globally.

Components use semantic tokens, never raw hex values.

### Data layer: swapping in Supabase

There's no backend yet. `src/lib/store.ts` is a persisted Zustand store seeded with demo data (`src/lib/seed.ts`). Its shape mirrors the Supabase data model in the MVP spec. To connect the real backend:

1. Generate DB types and map them to `src/lib/types.ts`.
2. Re-implement the read hooks in `src/lib/queries.ts` with Supabase queries plus Realtime subscriptions (chat, timer sync, heatmap).
3. Re-implement each store action as a Supabase insert or update; Row Level Security enforces membership.

Screens only talk to the hooks and actions, so the UI doesn't change. Session Mode already works the way the spec describes: it stores `current_step` and `step_started_at`, and each client computes the remaining time. Opening two tabs shows the timer staying in sync; the `storage` event stands in for Realtime.
