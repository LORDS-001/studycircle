create or replace function public.is_group_member(gid uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.group_members gm where gm.group_id=gid and gm.user_id=auth.uid() and gm.status='active')
$$;
create or replace function public.is_group_owner(gid uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.group_members gm where gm.group_id=gid and gm.user_id=auth.uid() and gm.role='owner' and gm.status='active')
$$;
create or replace function public.session_group(sid uuid) returns uuid
language sql stable security definer set search_path=public as $$ select group_id from public.sessions where id=sid $$;
create or replace function public.shares_group(other uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.group_members a join public.group_members b using(group_id)
 where a.user_id=auth.uid() and a.status='active' and b.user_id=other and b.status='active')
$$;

do $$ declare t text; begin
  foreach t in array array['profiles','courses','course_members','groups','group_members','availability','sessions','session_rsvps','session_roles','prep_items','prep_done','questions','quiz_attempts','retros','messages'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant select on public.profiles to authenticated;
grant update(name,school,avatar_url,email_reminders,email_group_activity,email_retros,onboarded) on public.profiles to authenticated;
grant select on public.courses, public.course_members to authenticated;
grant select on public.groups to authenticated;
grant update(name,description,max_size,visibility,goal,norms,cadence,exam_date,pinned_message) on public.groups to authenticated;
grant select on public.group_members, public.availability, public.sessions, public.session_rsvps, public.session_roles, public.prep_items, public.prep_done, public.questions, public.quiz_attempts, public.retros, public.messages to authenticated;
grant insert, update, delete on public.course_members to authenticated;
grant insert, update, delete on public.questions to authenticated;
grant insert on public.messages, public.quiz_attempts to authenticated;

revoke insert, update, delete on public.retros, public.session_roles, public.session_rsvps,
  public.prep_done, public.availability, public.prep_items from authenticated;

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename=any(array['retros', 'session_roles', 'session_rsvps', 'prep_done', 'availability', 'prep_items'])
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  loop
    execute format('drop policy %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end
$$;

-- Prevent owners from shrinking a group below its active membership.
create or replace function public.guard_group_max_size()
returns trigger
language plpgsql security definer set search_path=public
as $$
declare
  active_count bigint;
begin
  if new.max_size < old.max_size then
    select count(*) into active_count
    from public.group_members
    where group_id=new.id and status='active';
    if new.max_size < active_count then
      raise exception using message='max_size cannot be below active member count', errcode='P0001';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists groups_max_size_guard on public.groups;
create trigger groups_max_size_guard
before update of max_size on public.groups
for each row execute function public.guard_group_max_size();

create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or exists(select 1 from public.course_members a join public.course_members b using(course_id) where a.user_id=auth.uid() and b.user_id=profiles.id) or public.shares_group(id));
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy courses_read on public.courses for select to authenticated using(true);
create policy course_members_read on public.course_members for select to authenticated using(true);
create policy course_members_insert on public.course_members for insert to authenticated with check(user_id=auth.uid());
create policy course_members_delete on public.course_members for delete to authenticated using(user_id=auth.uid());
create policy groups_read on public.groups for select to authenticated using(true);
create policy groups_update on public.groups for update to authenticated using(public.is_group_owner(id)) with check(public.is_group_owner(id));
create policy group_members_read on public.group_members for select to authenticated using(user_id=auth.uid() or public.is_group_member(group_id) or exists(select 1 from public.groups g where g.id=group_id and g.visibility='public'));
create policy availability_read on public.availability for select to authenticated using(public.is_group_member(group_id));
create policy sessions_read on public.sessions for select to authenticated using(public.is_group_member(group_id));
create policy sessions_insert on public.sessions for insert to authenticated with check(public.is_group_member(group_id) and created_by=auth.uid());
create policy sessions_update on public.sessions for update to authenticated using(public.is_group_member(group_id)) with check(public.is_group_member(group_id));
create policy sessions_delete on public.sessions for delete to authenticated using(public.is_group_member(group_id));
create policy rsvps_read on public.session_rsvps for select to authenticated using(public.is_group_member(public.session_group(session_id)));
create policy roles_read on public.session_roles for select to authenticated using(public.is_group_member(public.session_group(session_id)));
create policy prep_read on public.prep_items for select to authenticated using(public.is_group_member(public.session_group(session_id)));
create policy prep_done_read on public.prep_done for select to authenticated using(public.is_group_member(public.session_group((select session_id from public.prep_items where id=prep_id))));
create policy questions_read on public.questions for select to authenticated using(public.is_group_member(group_id));
create policy questions_insert on public.questions for insert to authenticated with check(public.is_group_member(group_id) and created_by=auth.uid());
create policy questions_update on public.questions for update to authenticated using(created_by=auth.uid() and public.is_group_member(group_id)) with check(created_by=auth.uid() and public.is_group_member(group_id));
create policy questions_delete on public.questions for delete to authenticated using(created_by=auth.uid() and public.is_group_member(group_id));
create policy attempts_read on public.quiz_attempts for select to authenticated using(user_id=auth.uid() and exists(select 1 from public.questions q where q.id=question_id and public.is_group_member(q.group_id)));
create policy attempts_insert on public.quiz_attempts for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.questions q where q.id=question_id and public.is_group_member(q.group_id)));
create policy retros_read on public.retros for select to authenticated using(public.is_group_member(public.session_group(session_id)));
create policy messages_read on public.messages for select to authenticated using(public.is_group_member(group_id));
create policy messages_insert on public.messages for insert to authenticated with check(user_id=auth.uid() and public.is_group_member(group_id));

revoke all on function public.is_group_member(uuid), public.is_group_owner(uuid), public.session_group(uuid), public.shares_group(uuid) from public, anon;
grant execute on function public.is_group_member(uuid), public.is_group_owner(uuid), public.session_group(uuid), public.shares_group(uuid) to authenticated;
