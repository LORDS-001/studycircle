-- Require an authenticated caller for privileged RPCs.
create or replace function public.require_user()
returns uuid
language plpgsql security definer set search_path=public
as $$
begin
  if auth.uid() is null then
    raise exception using message='Authentication required', errcode='P0001';
  end if;
  return auth.uid();
end
$$;

-- Create a course and enroll its creator.
create or replace function public.create_course(code text, title text, school text)
returns public.courses
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
  norm text;
  c public.courses;
begin
  norm := regexp_replace(upper(btrim(create_course.code)), '^([A-Z]+)\s*(\d+)', '\1 \2');
  if exists (
    select 1 from public.courses x
    where lower(regexp_replace(x.code, '\s', '', 'g')) = lower(regexp_replace(norm, '\s', '', 'g'))
      and lower(regexp_replace(x.school, '\s', '', 'g')) = lower(regexp_replace(btrim(create_course.school), '\s', '', 'g'))
  ) then
    raise exception using message=norm || ' at ' || btrim(create_course.school) || ' already exists. Join it instead.', errcode='P0001';
  end if;
  insert into public.courses(code, title, school, created_by)
  values(norm, btrim(create_course.title), btrim(create_course.school), uid)
  returning * into c;
  insert into public.course_members values(c.id, uid, now());
  return c;
end
$$;

-- Create a study group and make its creator the owner.
create or replace function public.create_group(course_id uuid, name text, description text, max_size int, visibility public.visibility, goal public.group_goal, norms text[], cadence text, exam_date date)
returns public.groups
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
  g public.groups;
  code text;
  prefix text;
  token bytea;
begin
  if not exists(select 1 from public.courses c where c.id=create_group.course_id) then
    raise exception using message='Course not found', errcode='P0001';
  end if;
  insert into public.course_members(course_id, user_id)
  values(create_group.course_id, uid) on conflict do nothing;
  prefix := rpad(substr(upper(regexp_replace(name, '[^A-Za-z]', '', 'g')), 1, 4), 4, 'X');
  loop
    token := gen_random_bytes(4);
    code := prefix || '-' || (
      select string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', get_byte(token, i) % 36 + 1, 1), '')
      from generate_series(0, 3) i
    );
    exit when not exists(select 1 from public.groups where invite_code=code);
  end loop;
  insert into public.groups(course_id, name, description, max_size, visibility, goal, norms, cadence, exam_date, invite_code, owner_id)
  values(create_group.course_id, btrim(name), coalesce(description, ''), max_size, visibility, goal, coalesce(norms, '{}'), coalesce(cadence, ''), exam_date, code, uid)
  returning * into g;
  insert into public.group_members(group_id, user_id, role, status)
  values(g.id, uid, 'owner', 'active');
  return g;
end
$$;

-- Join an available group or request membership in a private group.
create or replace function public.join_group(group_id uuid)
returns text
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
  g public.groups;
  st public.member_status;
begin
  select * into g from public.groups where id=join_group.group_id for update;
  if not found then
    return 'full';
  end if;
  if exists(select 1 from public.group_members m where m.group_id=join_group.group_id and m.user_id=uid) then
    return 'already';
  end if;
  if (select count(*) from public.group_members m where m.group_id=join_group.group_id and m.status='active') >= g.max_size then
    return 'full';
  end if;
  st := case when g.visibility='public' then 'active' else 'pending' end;
  insert into public.group_members(group_id, user_id, status) values(g.id, uid, st);
  insert into public.course_members(course_id, user_id) values(g.course_id, uid) on conflict do nothing;
  return case when st='active' then 'joined' else 'pending' end;
end
$$;

-- Look up a group and its course from an invite code.
create or replace function public.group_by_invite(code text)
returns table(id uuid, course_id uuid, name text, description text, max_size int, visibility public.visibility, goal public.group_goal, norms text[], cadence text, exam_date date, invite_code text, owner_id uuid, pinned_message text, created_at timestamptz, member_count bigint, course_code text, course_title text)
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  return query
    select g.id, g.course_id, g.name, g.description, g.max_size, g.visibility, g.goal, g.norms, g.cadence, g.exam_date, g.invite_code, g.owner_id, g.pinned_message, g.created_at,
      (select count(*) from public.group_members m where m.group_id=g.id and m.status='active'), c.code, c.title
    from public.groups g join public.courses c on c.id=g.course_id
    where upper(g.invite_code)=upper(code);
end
$$;

-- Approve a pending member if the caller owns the group and capacity remains.
create or replace function public.approve_member(group_id uuid, user_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_owner(group_id) then
    raise exception using message='Only the owner can approve members', errcode='P0001';
  end if;
  if (select count(*) from public.group_members m where m.group_id=approve_member.group_id and m.status='active') >= (select max_size from public.groups where id=approve_member.group_id) then
    raise exception using message='Group is full', errcode='P0001';
  end if;
  update public.group_members set status='active'
  where group_members.group_id=approve_member.group_id and group_members.user_id=approve_member.user_id and status='pending';
end
$$;

-- Decline a pending membership request.
create or replace function public.decline_member(group_id uuid, user_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_owner(group_id) then
    raise exception using message='Only the owner can decline members', errcode='P0001';
  end if;
  delete from public.group_members where group_members.group_id=decline_member.group_id and group_members.user_id=decline_member.user_id and status='pending';
end
$$;

-- Remove a non-owner from a group.
create or replace function public.remove_member(group_id uuid, user_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_owner(group_id) then
    raise exception using message='Only the owner can remove members', errcode='P0001';
  end if;
  if exists(select 1 from public.groups where id=remove_member.group_id and owner_id=remove_member.user_id) then
    raise exception using message='Cannot remove the owner', errcode='P0001';
  end if;
  delete from public.group_members where group_members.group_id=remove_member.group_id and group_members.user_id=remove_member.user_id;
end
$$;

-- Leave a group, deleting it when its owner is the last active member.
create or replace function public.leave_group(group_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
begin
  if exists(select 1 from public.groups where id=leave_group.group_id and owner_id=uid)
    and exists(select 1 from public.group_members where group_members.group_id=leave_group.group_id and user_id<>uid and status='active') then
    raise exception using message='Transfer ownership before leaving', errcode='P0001';
  end if;
  delete from public.group_members where group_members.group_id=leave_group.group_id and user_id=uid;
  if exists(select 1 from public.groups where id=leave_group.group_id and owner_id=uid) then
    delete from public.groups where id=leave_group.group_id;
  end if;
end
$$;

-- Transfer group ownership to another active member.
create or replace function public.transfer_ownership(group_id uuid, user_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_owner(group_id) then
    raise exception using message='Only the owner can transfer ownership', errcode='P0001';
  end if;
  if not exists(select 1 from public.group_members where group_members.group_id=transfer_ownership.group_id and group_members.user_id=transfer_ownership.user_id and status='active') then
    raise exception using message='Target must be an active member', errcode='P0001';
  end if;
  update public.group_members set role=case when group_members.user_id=transfer_ownership.user_id then 'owner'::public.member_role else 'member'::public.member_role end
  where group_members.group_id=transfer_ownership.group_id;
  update public.groups set owner_id=transfer_ownership.user_id where id=transfer_ownership.group_id;
end
$$;

-- Create one session or a recurring session series with initial RSVPs and roles.
create or replace function public.create_session(group_id uuid, title text, template public.session_template, starts_at timestamptz, duration_min int, location_type text, place text, recurrence public.recurrence, agenda text, prep text[], jigsaw_topics jsonb)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
  g public.groups;
  series uuid;
  sid uuid;
  cursor_at timestamptz := starts_at;
  limit_at timestamptz;
  n int := 0;
  flip boolean := false;
  video text;
  token bytea;
  started int;
  member_count int;
  member_row record;
  role_order text[] := array['facilitator', 'timekeeper', 'scribe', 'questioner'];
  role_index int;
  assigned_role public.session_role;
  prep_text text;
begin
  if not public.is_group_member(group_id) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  if duration_min not between 15 and 240 or location_type not in ('video', 'place') then
    raise exception using message='Invalid session settings', errcode='P0001';
  end if;
  select * into g from public.groups where id=create_session.group_id;
  limit_at := case when g.exam_date is null then starts_at + interval '6 weeks' else (g.exam_date + 1)::timestamptz - interval '1 microsecond' end;
  series := case when recurrence='none' then null else gen_random_uuid() end;
  if location_type='video' then
    token := gen_random_bytes(16);
    video := 'https://meet.jit.si/studycircle-' || (select string_agg(substr('abcdefghijklmnopqrstuvwxyz0123456789', get_byte(token, i) % 36 + 1, 1), '') from generate_series(0, 15) i);
  end if;
  select count(*) into started from public.sessions s where s.group_id=create_session.group_id and s.status<>'scheduled';
  select count(*) into member_count from public.group_members gm where gm.group_id=create_session.group_id and gm.status='active';
  loop
    exit when n>=24 or (recurrence='none' and n>0) or (recurrence<>'none' and n>0 and cursor_at>limit_at);
    insert into public.sessions(group_id, series_id, title, template, starts_at, duration_min, location, video_url, recurrence, agenda, created_by)
    values(create_session.group_id, series, btrim(title), template, cursor_at, duration_min, case when location_type='video' then 'Video call' else coalesce(nullif(btrim(place), ''), 'To be decided') end, video, recurrence, coalesce(agenda, ''), uid)
    returning id into sid;
    insert into public.session_rsvps values(sid, uid, 'yes');
    for member_row in
      select gm.user_id, row_number() over(order by gm.joined_at, gm.user_id) - 1 as pos
      from public.group_members gm where gm.group_id=create_session.group_id and gm.status='active'
    loop
      role_index := (member_row.pos + started) % member_count;
      assigned_role := case when role_index < 4 then role_order[role_index + 1]::public.session_role else null end;
      insert into public.session_roles(session_id, user_id, role, jigsaw_topic)
      values(sid, member_row.user_id, assigned_role, jigsaw_topics->>member_row.user_id::text);
    end loop;
    for prep_text in select v from unnest(coalesce(prep, '{}')) as items(v) where v<>'' loop
      insert into public.prep_items(session_id, text, position)
      values(sid, prep_text, (select count(*)::int + 1 from public.prep_items where session_id=sid));
    end loop;
    n := n + 1;
    if recurrence='weekly' then
      cursor_at := cursor_at + interval '7 days';
    elsif recurrence='twice-weekly' then
      cursor_at := cursor_at + case when flip then interval '4 days' else interval '3 days' end;
      flip := not flip;
    else
      exit;
    end if;
  end loop;
  return sid;
end
$$;

-- Update supported session fields for a group member.
create or replace function public.update_session(session_id uuid, patch jsonb)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(session_id)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  if patch - array['title', 'starts_at', 'duration_min', 'location', 'video_url', 'agenda', 'template']::text[] <> '{}'::jsonb then
    raise exception using message='Unsupported session field', errcode='P0001';
  end if;
  update public.sessions
  set title=coalesce(patch->>'title', title), starts_at=coalesce((patch->>'starts_at')::timestamptz, starts_at), duration_min=coalesce((patch->>'duration_min')::int, duration_min),
      location=coalesce(patch->>'location', location), video_url=case when patch?'video_url' then patch->>'video_url' else video_url end,
      agenda=coalesce(patch->>'agenda', agenda), template=coalesce((patch->>'template')::public.session_template, template)
  where id=session_id;
end
$$;

-- Delete a session for a group member.
create or replace function public.delete_session(session_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(session_id)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  delete from public.sessions where id=session_id;
end
$$;

-- Save or update the caller's RSVP.
create or replace function public.rsvp(session_id uuid, status public.rsvp_status)
returns void
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
begin
  if not public.is_group_member(public.session_group(rsvp.session_id)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  insert into public.session_rsvps values(rsvp.session_id, uid, rsvp.status)
  on conflict on constraint session_rsvps_pkey do update set status=excluded.status;
end
$$;

-- Toggle the caller's completion state for a prep item.
create or replace function public.toggle_prep(prep_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
  sid uuid;
begin
  select session_id into sid from public.prep_items where id=toggle_prep.prep_id;
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  delete from public.prep_done where prep_done.prep_id=toggle_prep.prep_id and user_id=uid;
  if not found then
    insert into public.prep_done values(prep_id, uid);
  end if;
end
$$;

-- Add a prep item for a session in the caller's group.
create or replace function public.add_prep_item(sid uuid, item_text text)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  item_id uuid;
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  if nullif(btrim(item_text), '') is null then
    raise exception using message='Prep item cannot be empty', errcode='P0001';
  end if;
  insert into public.prep_items(session_id, text, position)
  values(sid, btrim(item_text), (select coalesce(max(position), 0) + 1 from public.prep_items where session_id=sid))
  returning id into item_id;
  return item_id;
end
$$;

-- Delete a prep item for a session in the caller's group.
create or replace function public.delete_prep_item(prep_id uuid)
returns void
language plpgsql security definer set search_path=public
as $$
declare
  sid uuid;
begin
  perform public.require_user();
  select session_id into sid from public.prep_items where id=delete_prep_item.prep_id;
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  delete from public.prep_items where id=delete_prep_item.prep_id;
end
$$;

-- Start a scheduled session.
create or replace function public.start_session(sid uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  if exists(select 1 from public.sessions where id=sid and status='ended') then
    raise exception using message='Session has ended', errcode='P0001';
  end if;
  update public.sessions set status='live', current_step=0, step_started_at=now(), paused_remaining_ms=null where id=sid;
end
$$;

-- Move a live session to a non-negative step.
create or replace function public.go_to_step(sid uuid, step int)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  if step < 0 then
    raise exception using message='Step must be non-negative', errcode='P0001';
  end if;
  if not exists(select 1 from public.sessions where id=sid and status='live') then
    raise exception using message='Session must be live', errcode='P0001';
  end if;
  update public.sessions set current_step=step, step_started_at=now(), paused_remaining_ms=null where id=sid;
end
$$;

-- Pause a live session and record its remaining time.
create or replace function public.pause_session(sid uuid, step_ms int)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  update public.sessions set paused_remaining_ms=greatest(0, step_ms - (extract(epoch from (now() - coalesce(step_started_at, now()))) * 1000)::int) where id=sid;
end
$$;

-- Resume a paused session with its saved remaining time.
create or replace function public.resume_session(sid uuid, step_ms int)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  update public.sessions set step_started_at=now() - ((step_ms - coalesce(paused_remaining_ms, step_ms))::text || ' milliseconds')::interval, paused_remaining_ms=null where id=sid;
end
$$;

-- End a session.
create or replace function public.end_session(sid uuid)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  update public.sessions set status='ended', paused_remaining_ms=null where id=sid;
end
$$;

-- Update session notes for a group member.
create or replace function public.update_notes(sid uuid, summary text, open_questions text, action_items text)
returns void
language plpgsql security definer set search_path=public
as $$
begin
  perform public.require_user();
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  update public.sessions
  set notes_summary=coalesce(summary, notes_summary), notes_open_questions=coalesce(open_questions, notes_open_questions),
      notes_action_items=coalesce(action_items, notes_action_items), notes_updated_at=now()
  where id=sid;
end
$$;

-- Save or update the caller's retrospective after the session ends.
create or replace function public.submit_retro(sid uuid, rating int, helped text, change text, balanced public.balanced)
returns void
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
begin
  if not public.is_group_member(public.session_group(sid)) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  if not exists(select 1 from public.sessions where id=sid and status='ended') then
    raise exception using message='Session must be ended before a retro', errcode='P0001';
  end if;
  insert into public.retros values(sid, uid, rating, coalesce(helped, ''), coalesce(change, ''), balanced)
  on conflict(session_id, user_id) do update set rating=excluded.rating, helped=excluded.helped, change=excluded.change, balanced=excluded.balanced;
end
$$;

-- Save or update availability for a group member.
create or replace function public.save_availability(group_id uuid, slots text[])
returns void
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
begin
  if not public.is_group_member(group_id) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  insert into public.availability values(group_id, uid, slots, now())
  on conflict(group_id, user_id) do update set slots=excluded.slots, updated_at=now();
end
$$;

-- Return contribution metrics for active members of a group.
create or replace function public.group_contribution(group_id uuid)
returns table(user_id uuid, attended bigint, scheduled bigint, rsvp_reliability int, questions bigint, taught text[], retros bigint)
language plpgsql security definer set search_path=public
as $$
#variable_conflict use_variable
begin
  perform public.require_user();
  if not public.is_group_member(group_id) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  return query
  select gm.user_id, count(s.id) filter(where s.status='ended' and r.status='yes'), count(s.id) filter(where s.status='ended'),
    case when count(s.id)=0 then 0 else round(count(r.session_id)::numeric / count(s.id) * 100)::int end,
    (select count(*) from public.questions q where q.group_id=group_id and q.created_by=gm.user_id),
    coalesce(array_agg(sr.jigsaw_topic order by s.starts_at) filter(where s.status='ended' and s.template='jigsaw' and sr.jigsaw_topic is not null), '{}'),
    (select count(*) from public.retros rt join public.sessions es on es.id=rt.session_id where rt.user_id=gm.user_id and es.group_id=group_id and es.status='ended')
  from public.group_members gm
  left join public.sessions s on s.group_id=group_id
  left join public.session_rsvps r on r.session_id=s.id and r.user_id=gm.user_id
  left join public.session_roles sr on sr.session_id=s.id and sr.user_id=gm.user_id
  where gm.group_id=group_id and gm.status='active'
  group by gm.user_id;
end
$$;

-- Restrict privileged RPCs to authenticated callers.
do $$
declare
  f regprocedure;
begin
  foreach f in array array[
    'public.create_course(text,text,text)'::regprocedure,
    'public.create_group(uuid,text,text,integer,public.visibility,public.group_goal,text[],text,date)'::regprocedure,
    'public.join_group(uuid)'::regprocedure,
    'public.group_by_invite(text)'::regprocedure,
    'public.approve_member(uuid,uuid)'::regprocedure,
    'public.decline_member(uuid,uuid)'::regprocedure,
    'public.remove_member(uuid,uuid)'::regprocedure,
    'public.leave_group(uuid)'::regprocedure,
    'public.transfer_ownership(uuid,uuid)'::regprocedure,
    'public.create_session(uuid,text,public.session_template,timestamptz,integer,text,text,public.recurrence,text,text[],jsonb)'::regprocedure,
    'public.update_session(uuid,jsonb)'::regprocedure,
    'public.delete_session(uuid)'::regprocedure,
    'public.rsvp(uuid,public.rsvp_status)'::regprocedure,
    'public.toggle_prep(uuid)'::regprocedure,
    'public.add_prep_item(uuid,text)'::regprocedure,
    'public.delete_prep_item(uuid)'::regprocedure,
    'public.start_session(uuid)'::regprocedure,
    'public.go_to_step(uuid,integer)'::regprocedure,
    'public.pause_session(uuid,integer)'::regprocedure,
    'public.resume_session(uuid,integer)'::regprocedure,
    'public.end_session(uuid)'::regprocedure,
    'public.update_notes(uuid,text,text,text)'::regprocedure,
    'public.submit_retro(uuid,integer,text,text,public.balanced)'::regprocedure,
    'public.save_availability(uuid,text[])'::regprocedure,
    'public.group_contribution(uuid)'::regprocedure
  ] loop
    execute format('revoke all on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;
