# StudyCircle web

The StudyCircle frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and Radix primitives.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # ESLint
npm run build    # production build (also type-checks)
npm start        # serve the production build
npx tsc --noEmit # type-check only
```

### Demo tour

There's no backend yet, so the app runs on demo data saved in your browser.

1. On the landing page, choose **Get started** and sign in with any email (or the Google button). You're signed in as **Ada**, who organises *Trees and Graphs Crew* (CSC 201) and is a member of *Eigen Friends* (MTH 201).
2. Open **Trees and Graphs Crew** and try each tab: Overview, Sessions, Availability, Questions, Notes, Chat and Members.
3. On **Availability**, switch to "Your week" and drag across the grid to paint your free time. Save it and the group heatmap and suggested times update.
4. Open the next session and press **Start session** to enter Session Mode. Space pauses and the arrow keys move between steps. Open the same page in a second tab to see the timer stay in sync.
5. Go to **Questions**, then **Quiz me**. Space reveals the answer; 1 and 2 mark it "Not yet" or "Got it".
6. The account menu (bottom left on desktop, top right on phones) switches between light, dark and auto themes. **Reset demo data** puts everything back.

## Project structure

| Path | What lives there |
| --- | --- |
| `src/app/page.tsx` | Landing page |
| `src/app/login`, `onboarding`, `invite/[code]` | Sign-in, onboarding and invite links (outside the app shell) |
| `src/app/(app)/…` | The signed-in app: dashboard, courses, groups and their tabs, session page, settings |
| `src/app/sessions/[sessionId]/live` | Session Mode, full screen |
| `src/components/ui` | Design-system primitives: Button, Field, Badge, Avatar, Dialog (a bottom sheet on phones), menus, Select, Switch, Segmented, Tabs, Panel |
| `src/components/brand` | Logo, mark, loader, and the ring visuals (`SeatRing` for group capacity, `StepRing` for the Session Mode timer) |
| `src/components/app` | Product components, prefixed by area (`session-*`, `availability-*`, `question-*`, `courses-*`, `chat-*`) |
| `src/components/marketing` | Landing page pieces: `IslandNav`, `Subjects`, and `bits.tsx` (`Bezel`, `ArrowButton`, `Eyebrow`, `Glow`, `HandNote`) |
| `src/lib` | Types, the demo store, read hooks, session templates and formatting helpers |
| `public/images` | Landing page photos, credited in [`CREDITS.md`](public/images/CREDITS.md) |

## Design system

Everything follows the StudyCircle brand guidelines. Colour, type and motion tokens live in `src/app/globals.css`.

- **Scholar palette:** cream canvas (`bg-background`), deep blue structure (`text-foreground`, `bg-primary`), teal for progress (`bg-teal`, `text-teal-text`), and gold only for celebrations (`bg-gold`). Every token has a dark-mode value. Use the semantic tokens, never raw hex. `brand-*` colours (`bg-brand-blue` and so on) stay the same in both themes.
- **Accessibility rules from the brand guide:** never put gold text or icons on cream. Use teal text only at 14px or larger, medium weight or heavier. Never rely on teal versus blue alone to tell two things apart.
- **Type scale:** `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small` and `text-label` match the six brand sizes. The app uses Plus Jakarta Sans throughout. The handwritten Caveat face (`font-hand`) is loaded only on the landing page, for its margin notes.
- **Motion:** custom curves (`--ease-out`, `--ease-drawer`). `pressable` adds press feedback, and `stagger` adds one entrance per page. The landing page also uses `enter` for its first paint and `reveal` for scroll-in effects. `reveal` is pure CSS: browsers without support show the content without the effect. Reduced motion is respected everywhere.
- **Landing page language:** content sits in two-layer frames (`Bezel`), main buttons are pills with the arrow in its own circle (`ArrowButton`), and section headings get small pill labels (`Eyebrow`). Section spacing is generous: `py-24` to `py-36`.

## Conventions and gotchas

- **Use `cn()` for class names.** It's set up to recognise the brand type utilities, so `cn("text-label", "text-teal-text")` keeps both classes.
- **Wrap filtered store selectors in `useShallow`.** A Zustand selector that returns a new array or object on every call (for example `s.sessions.filter(…)`) causes an infinite render loop in Zustand v5. Wrap it with `useShallow` from `zustand/react/shallow`, or select the raw list and `useMemo` it.
- **Signed-in pages are client components.** The data lives in the browser store, so these pages start with `"use client"` and are gated by `AuthGate` in `src/components/app/app-shell.tsx`.
- **`cacheComponents` is on.** Anything that reads the URL (`usePathname`, `useSearchParams`, `useParams`) must sit under a `<Suspense>` boundary. `AuthGate` already provides one for app pages. Until server-side auth exists, `next.config.ts` sets `experimental.instantInsights.validationLevel` to `"manual-warning"`, which stops dev warnings about client-rendered pages.
- **Log out through `signOutAndLeave(router)`** (`src/components/app/sign-out.ts`). Calling `signOut()` directly makes the auth gate send you to `/login`.
- **Read the bundled Next.js docs.** This is Next.js 16 and some APIs differ from older versions. The docs for this exact version are in `node_modules/next/dist/docs/`.

## Data layer: swapping in Supabase

There's no backend yet. `src/lib/store.ts` is a Zustand store, persisted to the browser and seeded with demo data (`src/lib/seed.ts`). Seed dates are relative to today, so the demo never goes stale. The store's shape mirrors the Supabase data model in the MVP spec.

To connect the real backend:

1. Generate the database types and map them to `src/lib/types.ts`.
2. Re-implement the read hooks in `src/lib/queries.ts` as Supabase queries plus Realtime subscriptions (chat, timer sync, heatmap).
3. Re-implement each store action as a Supabase insert or update. Row Level Security limits each group's data to its active members.

Screens only talk to the hooks and actions, so the UI doesn't change.

Session Mode already works the way the spec describes. The session stores `current_step` and `step_started_at`, and each client computes the remaining time itself. Opening two tabs shows the timer staying in sync, with the browser's `storage` event standing in for Realtime.

## Deployment

On Vercel, set the project's **Root Directory** to `web`. No environment variables are needed until Supabase is connected.
