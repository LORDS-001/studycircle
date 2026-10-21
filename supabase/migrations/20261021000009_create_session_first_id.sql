-- Return the first session created in a recurring series.
create or replace function public.create_session(group_id uuid, title text, template public.session_template, starts_at timestamptz, duration_min int, location_type text, place text, recurrence public.recurrence, agenda text, prep text[], jigsaw_topics jsonb)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
  g public.groups;
  series uuid;
  sid uuid;
  first_sid uuid;
  cursor_at timestamptz := starts_at;
  limit_at timestamptz;
  n int := 0;
  flip boolean := false;
  video text;
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
    video := 'https://meet.jit.si/studycircle-' || lower(public.random_token(16));
  end if;
  select count(*) into started from public.sessions s where s.group_id=create_session.group_id and s.status<>'scheduled';
  select count(*) into member_count from public.group_members gm where gm.group_id=create_session.group_id and gm.status='active';
  loop
    exit when n>=24 or (recurrence='none' and n>0) or (recurrence<>'none' and n>0 and cursor_at>limit_at);
    insert into public.sessions(group_id, series_id, title, template, starts_at, duration_min, location, video_url, recurrence, agenda, created_by)
    values(create_session.group_id, series, btrim(title), template, cursor_at, duration_min, case when location_type='video' then 'Video call' else coalesce(nullif(btrim(place), ''), 'To be decided') end, video, recurrence, coalesce(agenda, ''), uid)
    returning id into sid;
    if first_sid is null then first_sid := sid; end if;
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
  return first_sid;
end
$$;

grant execute on function public.create_session(uuid,text,public.session_template,timestamptz,integer,text,text,public.recurrence,text,text[],jsonb) to authenticated;
