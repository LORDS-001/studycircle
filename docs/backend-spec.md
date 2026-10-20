# StudyCircle backend spec (MVP)

Owner: backend lead. Implementers: agents. This file is the contract; if something here is wrong, flag it rather than silently diverging.

## Shape

Supabase only (free tier): Postgres + RLS + RPC functions + Auth + Realtime, plus one Edge Function for reminder email (Resend). No separate server.

```
supabase/
  config.toml                  # supabase CLI project config (project_id = "studycircle")
  migrations/
    20261020000001_schema.sql  # extensions, enums, tables, indexes, triggers
    20261020000002_rls.sql     # helper functions + policies + grants
    20261020000003_rpc.sql     # business-logic functions (security definer)
    20261020000004_realtime.sql# publication + replica identity
    20261020000005_reminders.sql # notifications_log, due_reminders(), pg_cron job (guarded)
  functions/send-reminders/index.ts  # Deno edge function, Resend
  seed.sql                     # demo data mirroring web/src/lib/seed.ts
  tests/
    00_auth_shim.sql           # LOCAL ONLY: fakes auth schema/roles so migrations run on vanilla Postgres
    *.test.sql                 # assertion scripts
  scripts/test.sh              # creates a throwaway DB, applies shim+migrations+seed, runs tests
```

Everything must apply cleanly **in order** on (a) a real Supabase project and (b) vanilla Postgres 17 after `00_auth_shim.sql`. Never reference Supabase-only objects except `auth.users`, `auth.uid()`, roles `anon`/`authenticated`/`service_role`, publication `supabase_realtime`, and extension `pg_cron` (guarded: only schedule if the extension exists).

## Conventions
- `uuid` PKs, `default gen_random_uuid()`. Timestamps `timestamptz default now()`.
- snake_case in DB. The frontend maps to its camelCase types in `web/src/lib/types.ts` — keep names 1:1 (`starts_at` ↔ `startsAt`).
- All writes that involve more than one row or a rule go through RPC functions (`security definer`, `set search_path = public`), raising `exception` with a short human message and an errcode (`P0001`) on rule violations. Simple single-row edits may use table policies directly.
- Enums: `group_goal(pass,b-plus,a,mastery)`, `visibility(public,private)`, `member_role(owner,member)`, `member_status(active,pending)`, `session_template(retrieval,jigsaw,cowork)`, `recurrence(none,weekly,twice-weekly)`, `session_status(scheduled,live,ended)`, `rsvp_status(yes,maybe,no)`, `session_role(facilitator,timekeeper,scribe,questioner)`, `balanced(yes,somewhat,no)`.

## Tables
| table | columns |
|---|---|
| profiles | id uuid PK → auth.users on delete cascade, name text not null, email text not null, school text not null default '', avatar_url text, hue int not null (0-359), email_reminders bool default true, email_group_activity bool default true, email_retros bool default true, onboarded bool default false, created_at |
| courses | id, code text, title text, school text, created_by → profiles, created_at; **unique index on (lower(regexp_replace(code,'\s','','g')), lower(regexp_replace(school,'\s','','g')))** |
| course_members | course_id, user_id, joined_at; PK(course_id,user_id) |
| groups | id, course_id → courses, name, description default '', max_size int check 3..6 default 5, visibility, goal, norms text[] default '{}', cadence text default '', exam_date date null, invite_code text unique, owner_id → profiles, pinned_message text null, created_at |
| group_members | group_id, user_id, role, status, joined_at; PK(group_id,user_id) |
| availability | group_id, user_id, slots text[] (each `"weekday:slot"`, weekday 0-6, slot 0-31; validate with check constraint), updated_at; PK(group_id,user_id) |
| sessions | id, group_id, series_id uuid null, title, template, starts_at, duration_min int check 15..240, location text, video_url text null, recurrence, agenda text default '', status default 'scheduled', current_step int default 0, step_started_at timestamptz null, paused_remaining_ms int null, notes_summary text default '', notes_open_questions text default '', notes_action_items text default '', notes_updated_at timestamptz null, created_by, created_at |
| session_rsvps | session_id, user_id, status; PK |
| session_roles | session_id, user_id, role null, jigsaw_topic text null; PK |
| prep_items | id, session_id, text, position int |
| prep_done | prep_id, user_id; PK |
| questions | id, group_id, topic, prompt, answer, explanation null, created_by, created_at |
| quiz_attempts | id, user_id, question_id on delete cascade, correct bool, attempted_at |
| retros | session_id, user_id, rating int 1..5, helped text, change text, balanced; PK(session_id,user_id); updated via upsert |
| messages | id, group_id, user_id, body text check length 1..4000, created_at |
| notifications_log | id, session_id, user_id, kind text ('reminder_24h','reminder_1h','quorum_warning'), sent_at; unique(session_id,user_id,kind) |

Index every FK used in RLS lookups (group_members(user_id), sessions(group_id, starts_at), messages(group_id, created_at), questions(group_id)).

## Auth
- Trigger on `auth.users` insert → create `profiles` row: name = `raw_user_meta_data->>'full_name'` or `name` or email local-part; email; hue = abs(hashtext(id::text)) % 360.
- Magic link + Google are configured in `config.toml` / dashboard; no SQL needed.

## RLS (enable on every table; deny by default)
Helpers (security definer, stable): `is_group_member(gid)` (active), `is_group_owner(gid)`, `session_group(sid)`, `shares_group(other uuid)`.
- profiles: select own row, or anyone who shares a group / course with you (needed for avatars/names); update own row only (cannot change id/email).
- courses: select for any authenticated; insert via `create_course` RPC only.
- course_members: select any authenticated; insert/delete own row.
- groups: select for authenticated (public groups visible in course lists; private groups visible by name/size for the course page and invite preview). Sensitive group content lives in other tables. Update: owner only, but not `owner_id`/`invite_code` (use RPCs).
- group_members: select if member of the group (any status of self) or group is visible; mutations via RPCs only.
- availability: select if member; insert/update own row if member.
- sessions, session_rsvps, session_roles, prep_items, prep_done, questions, messages: select if member of the owning group. Inserts/updates: member, own rows only where a user_id column exists; messages.user_id must = auth.uid(); questions update/delete only by created_by.
- quiz_attempts: select/insert own rows only, and only for questions in groups you belong to.
- retros: select if member of the session's group; insert/update own only.
- notifications_log: no client access (service_role only).

## RPC functions (all `security definer`, check `auth.uid()` is not null)
| function | behaviour |
|---|---|
| `create_course(code, title, school) → courses` | normalise code `^([A-Z]+)\s*(\d+)` → `"CSC 201"`; duplicate → error `"<CODE> at <school> already exists. Join it instead."`; auto-join creator |
| `create_group(course_id, name, description, max_size, visibility, goal, norms, cadence, exam_date) → groups` | generate invite_code `XXXX-XXXX` (4 letters from name upper, padded X, + 4 random [A-Z0-9]); creator owner+active; auto-join course |
| `join_group(group_id) → text` | returns `'joined' | 'pending' | 'full' | 'already'`; public→active, private→pending; full counts active only; auto-join course |
| `group_by_invite(code) → table(group row + member_count + course code/title)` | callable by authenticated, for invite preview |
| `approve_member / decline_member / remove_member(group_id, user_id)` | owner only; cannot remove owner |
| `leave_group(group_id)` | owner cannot leave while other active members exist (must transfer); last member leaving deletes the group |
| `transfer_ownership(group_id, user_id)` | owner only; target must be active member |
| `create_session(group_id, title, template, starts_at, duration_min, location_type 'video'|'place', place, recurrence, agenda, prep text[], jigsaw_topics jsonb {user_id: topic}) → uuid (first session id)` | member only. Occurrences exactly like `occurrences()` in `web/src/lib/store.ts`: none→1; weekly +7d; twice-weekly alternate +3d,+4d; until exam_date (end of day) else +6 weeks; max 24; if none fall before the limit still create the first. One shared series_id when recurring. video → one shared `https://meet.jit.si/studycircle-<16 random [a-z0-9]>` . Roles rotate: `count` = sessions in group with status <> 'scheduled'; active members ordered by joined_at, member i gets ROLE_ORDER[(i+count) % n] where ROLE_ORDER = facilitator,timekeeper,scribe,questioner and index ≥4 → null. Creator RSVP yes. Copy prep items per occurrence. |
| `update_session(session_id, patch jsonb)` | member; allowed keys: title, starts_at, duration_min, location, video_url, agenda, template |
| `delete_session(session_id)` | member |
| `rsvp(session_id, status)` | upsert own |
| `toggle_prep(prep_id)` | toggle own done |
| `start_session(sid)`, `go_to_step(sid, step)`, `pause_session(sid, step_ms int)`, `resume_session(sid, step_ms int)`, `end_session(sid)` | member. Server is the clock: start → status live, step 0, step_started_at now(), paused null. go_to_step → step, now(), paused null. pause → paused_remaining_ms = greatest(0, step_ms − elapsed ms). resume → step_started_at = now() − (step_ms − paused_remaining_ms), paused null. end → ended, paused null. (Client sends step_ms because step lengths are a frontend template concern.) |
| `update_notes(sid, summary, open_questions, action_items)` | member; nulls mean "keep"; sets notes_updated_at |
| `submit_retro(sid, rating, helped, change, balanced)` | member; session must be ended; upsert |
| `save_availability(group_id, slots text[])` | member; upsert own |
| `group_contribution(group_id) → table(user_id, attended, scheduled, rsvp_reliability, questions, taught text[], retros)` | member; same maths as `useContribution` in `web/src/lib/queries.ts` |

Grant execute on these to `authenticated` only; revoke from `public`/`anon`.

## Realtime
Add to publication `supabase_realtime` (create it if absent — shim does this locally): messages, sessions, availability, session_rsvps, group_members, prep_done. `replica identity full` on sessions and availability.

## Reminders
- `due_reminders()` (service_role only) returns rows (session_id, user_id, email, name, kind, session title, starts_at, group name, location, video_url) for: `reminder_24h` when starts_at within (now+23h55m, now+24h05m] — actually use window `starts_at between now()+interval '23 hours 55 min' and now()+interval '24 hours 5 min'`; `reminder_1h` same around 1h; recipients RSVP yes/maybe, `email_reminders` true, not already in notifications_log. `quorum_warning` to owner at the 24h window when yes-count < ceil(active/2).
- `mark_reminder_sent(session_id, user_id, kind)` inserts into log (on conflict do nothing).
- pg_cron: `select cron.schedule('send-reminders','*/5 * * * *', $$ select net.http_post(...) $$)` ONLY inside a `do $$ ... $$` that checks the extensions exist; URL and service key read from `current_setting('app.functions_url', true)` / vault — document the manual step in README instead of hard-coding.
- Edge function: POST, verifies `Authorization: Bearer <SERVICE_ROLE_KEY>`; calls `due_reminders`, sends each via Resend (`RESEND_API_KEY`, `REMINDER_FROM`), then `mark_reminder_sent`. Plain-text + simple HTML body. Never throws on a single failed email.

## Tests (must pass via `supabase/scripts/test.sh` on local Postgres 17)
Cover at least: profile trigger; course duplicate rule; create_group/join_group all four outcomes; private join pending → approve; non-member cannot select sessions/messages/questions of a group (RLS as `authenticated` with another sub); create_session occurrence counts (none/weekly/twice-weekly, exam cut-off) and role rotation; timer pause/resume maths; retro only after ended; quiz_attempts isolation; contribution numbers on seed data; due_reminders dedupe.
Tests run as role `authenticated` with `set local request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}'`.
