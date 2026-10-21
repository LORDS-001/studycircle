create extension if not exists pgcrypto;

do $$ begin
  create type public.group_goal as enum ('pass','b-plus','a','mastery');
  create type public.visibility as enum ('public','private');
  create type public.member_role as enum ('owner','member');
  create type public.member_status as enum ('active','pending');
  create type public.session_template as enum ('retrieval','jigsaw','cowork');
  create type public.recurrence as enum ('none','weekly','twice-weekly');
  create type public.session_status as enum ('scheduled','live','ended');
  create type public.rsvp_status as enum ('yes','maybe','no');
  create type public.session_role as enum ('facilitator','timekeeper','scribe','questioner');
  create type public.balanced as enum ('yes','somewhat','no');
end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  school text not null default '',
  avatar_url text,
  hue int not null check (hue between 0 and 359),
  email_reminders boolean not null default true,
  email_group_activity boolean not null default true,
  email_retros boolean not null default true,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(), code text not null, title text not null,
  school text not null, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create unique index courses_code_school_normalized_idx on public.courses
  (lower(regexp_replace(code, '\s', '', 'g')), lower(regexp_replace(school, '\s', '', 'g')));
create table public.course_members (
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), primary key(course_id,user_id)
);
create table public.groups (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  name text not null, description text not null default '', max_size int not null default 5 check(max_size between 3 and 6),
  visibility public.visibility not null, goal public.group_goal not null, norms text[] not null default '{}', cadence text not null default '',
  exam_date date, invite_code text not null unique, owner_id uuid not null references public.profiles(id),
  pinned_message text, created_at timestamptz not null default now()
);
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member', status public.member_status not null default 'active',
  joined_at timestamptz not null default now(), primary key(group_id,user_id)
);
create index group_members_user_id_idx on public.group_members(user_id);
create or replace function public.valid_availability_slots(slots text[]) returns boolean
language sql immutable strict as $$
  select not exists (
    select 1 from unnest(slots) slot
    where slot !~ '^[0-6]:([0-9]|[12][0-9]|3[01])$'
  )
$$;
create table public.availability (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  slots text[] not null default '{}', updated_at timestamptz not null default now(), primary key(group_id,user_id),
  check (public.valid_availability_slots(slots))
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id) on delete cascade,
  series_id uuid, title text not null, template public.session_template not null, starts_at timestamptz not null,
  duration_min int not null check(duration_min between 15 and 240), location text not null, video_url text,
  recurrence public.recurrence not null default 'none', agenda text not null default '',
  status public.session_status not null default 'scheduled', current_step int not null default 0,
  step_started_at timestamptz, paused_remaining_ms int, notes_summary text not null default '',
  notes_open_questions text not null default '', notes_action_items text not null default '', notes_updated_at timestamptz,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create index sessions_group_starts_idx on public.sessions(group_id,starts_at);
create table public.session_rsvps (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.rsvp_status not null, primary key(session_id,user_id)
);
create table public.session_roles (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.session_role, jigsaw_topic text, primary key(session_id,user_id)
);
create table public.prep_items (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.sessions(id) on delete cascade,
  text text not null, position int not null
);
create table public.prep_done (
  prep_id uuid not null references public.prep_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, primary key(prep_id,user_id)
);
create table public.questions (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id) on delete cascade,
  topic text not null, prompt text not null, answer text not null, explanation text,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create index questions_group_idx on public.questions(group_id);
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade, correct boolean not null, attempted_at timestamptz not null default now()
);
create table public.retros (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check(rating between 1 and 5), helped text not null default '', change text not null default '',
  balanced public.balanced not null, primary key(session_id,user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(char_length(body) between 1 and 4000), created_at timestamptz not null default now()
);
create index messages_group_created_idx on public.messages(group_id,created_at);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare nm text;
begin
  nm := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1));
  insert into public.profiles(id,name,email,hue) values(new.id,nm,new.email,abs(hashtext(new.id::text)) % 360);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
