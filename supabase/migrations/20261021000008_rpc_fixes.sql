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
    where upper(g.invite_code)=upper(group_by_invite.code);
end
$$;

grant execute on function public.group_by_invite(text) to authenticated;

create or replace function public.save_availability(group_id uuid, slots text[])
returns void
language plpgsql security definer set search_path=public
as $$
declare
  uid uuid := public.require_user();
begin
  if not public.is_group_member(save_availability.group_id) then
    raise exception using message='Join the group first', errcode='P0001';
  end if;
  insert into public.availability values(save_availability.group_id, uid, save_availability.slots, now())
  on conflict on constraint availability_pkey do update set slots=excluded.slots, updated_at=now();
end
$$;

grant execute on function public.save_availability(uuid,text[]) to authenticated;
