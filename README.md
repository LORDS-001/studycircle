# StudyCircle

**Not another group chat: the app that makes your study group actually work.**

StudyCircle helps university students form small study groups (3 to 6 people), find a time that works for everyone, and run each session well. Research-backed methods are built into the product: retrieval practice, spaced sessions, learning by teaching (Jigsaw), rotating roles and group reflection.

## Status

| Part | State |
| --- | --- |
| Frontend (`web/`) | Every MVP screen is built, responsive from 360px, with light and dark themes |
| Backend | Not started. The frontend runs on a typed demo store that mirrors the planned Supabase data model |

## What's in the frontend

- **Landing page:** photo hero, a bento grid of product previews, subjects, session roles and a closing call to action. Built on the agreed template and styled to the brand.
- **Getting in:** sign in with Google or an email magic link, two-step onboarding, and invite links that preview a group before joining.
- **Courses and groups:** join or create courses, create groups with a charter (goal, norms, cadence, exam date), manage invites and join requests.
- **Scheduling:** an availability heatmap with the top three suggested times, recurring sessions up to the exam, RSVPs and "Add to calendar" (`.ics`).
- **Session Mode:** a full-screen shared timer that walks the group through Retrieval Round, Jigsaw or Co-work templates, with rotating roles and live notes.
- **Learning:** a shared question bank, a quiz mode that hides answers until you reveal them, and per-topic progress.
- **Keeping it going:** the notes archive, two-minute retros, group chat, and a contribution view that thanks people instead of ranking them.

## Quick start

You need Node.js 20 or later.

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000, choose **Get started**, and sign in with any email. See [web/README.md](web/README.md) for the full developer guide.

## Repository

| Path | Contents |
| --- | --- |
| [`web/`](web/) | Next.js 16 frontend (TypeScript, Tailwind CSS v4, Radix) |

## Tech stack

| Layer | Tool |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Radix primitives, lucide icons |
| State (for now) | Zustand, persisted to the browser |
| Planned backend | Supabase (Postgres with Row Level Security, Auth, Realtime), Resend for email, Jitsi for video |
| Hosting | Vercel, with the project root set to `web/` |

## Next steps

1. Set up Supabase: the schema, Row Level Security policies and auth (magic link and Google).
2. Swap the demo store for Supabase queries, actions and Realtime. The [web README](web/README.md#data-layer-swapping-in-supabase) explains how; no screens need to change.
3. Reminder emails with `pg_cron`, an Edge Function and Resend.
4. Playwright end-to-end tests for the main flows.
