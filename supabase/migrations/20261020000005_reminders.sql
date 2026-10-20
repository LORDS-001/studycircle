create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check(kind in ('reminder_24h', 'reminder_1h', 'quorum_warning')),
  sent_at timestamptz not null default now(),
  unique(session_id, user_id, kind)
);
alter table public.notifications_log enable row level security;
revoke all on public.notifications_log from public, anon, authenticated;
grant all on public.notifications_log to service_role;
-- Return due reminder messages not already logged as sent.
create or replace function public.due_reminders()
returns table(session_id uuid, user_id uuid, email text, name text, kind text, title text, starts_at timestamptz, group_name text, location text, video_url text)
language sql security definer set search_path=public
as $$
  with windows as (
    select s.*, g.name as group_name
    from public.sessions s
    join public.groups g on g.id=s.group_id
    where s.status='scheduled'
      and (
        s.starts_at between now() + interval '23 hours 55 minutes' and now() + interval '24 hours 5 minutes'
        or s.starts_at between now() + interval '55 minutes' and now() + interval '65 minutes'
      )
  ), recipients as (
    select w.id as session_id, r.user_id, p.email, p.name, w.title, w.starts_at, w.group_name, w.location, w.video_url,
      case when w.starts_at between now() + interval '23 hours 55 minutes' and now() + interval '24 hours 5 minutes' then 'reminder_24h' else 'reminder_1h' end as kind
    from windows w
    join public.session_rsvps r on r.session_id=w.id and r.status in ('yes', 'maybe')
    join public.profiles p on p.id=r.user_id and p.email_reminders
  ), quorum as (
    select w.id as session_id, g.owner_id as user_id, p.email, p.name, w.title, w.starts_at, w.group_name, w.location, w.video_url, 'quorum_warning'::text as kind
    from windows w
    join public.groups g on g.id=w.group_id
    join public.profiles p on p.id=g.owner_id and p.email_reminders
    where w.starts_at between now() + interval '23 hours 55 minutes' and now() + interval '24 hours 5 minutes'
      and (select count(*) from public.session_rsvps r where r.session_id=w.id and r.status='yes')
        < ceil((select count(*) from public.group_members gm where gm.group_id=w.group_id and gm.status='active') / 2.0)
  )
  select x.session_id, x.user_id, x.email, x.name, x.kind, x.title, x.starts_at, x.group_name, x.location, x.video_url
  from (select * from recipients union all select * from quorum) x
  where not exists(
    select 1 from public.notifications_log l
    where l.session_id=x.session_id and l.user_id=x.user_id and l.kind=x.kind
  )
$$;
-- Record that a reminder was sent, ignoring duplicate deliveries.
create or replace function public.mark_reminder_sent(session_id uuid, user_id uuid, kind text)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  insert into public.notifications_log(session_id, user_id, kind)
  values(mark_reminder_sent.session_id, mark_reminder_sent.user_id, mark_reminder_sent.kind)
  on conflict do nothing;
end
$$;
revoke all on function public.due_reminders(), public.mark_reminder_sent(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.due_reminders(), public.mark_reminder_sent(uuid,uuid,text) to service_role;
do $$
begin
  -- Configure app.functions_url and app.service_role_key (or use Vault) before enabling this job.
  if exists(select 1 from pg_extension where extname='pg_cron')
    and exists(select 1 from pg_extension where extname='pg_net') then
    perform cron.schedule(
      'send-reminders',
      '*/5 * * * *',
      $job$
        select net.http_post(
          url := current_setting('app.functions_url', true) || '/send-reminders',
          headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key', true)),
          body := '{}'::jsonb
        )
      $job$
    );
  end if;
exception when others then
  raise notice 'Could not schedule send-reminders cron job: %', sqlerrm;
end
$$;
