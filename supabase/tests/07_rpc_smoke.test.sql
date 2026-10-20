begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('70000000-0000-0000-0000-000000000001','rpc-owner@example.test','{"name":"RPC Owner"}'),
 ('70000000-0000-0000-0000-000000000002','rpc-member@example.test','{"name":"RPC Member"}'),
 ('70000000-0000-0000-0000-000000000003','rpc-third@example.test','{"name":"RPC Third"}');

set local role authenticated;
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}';
select (public.create_course('RPC 101','RPC Smoke Course','Smoke School')).id as cid \gset
select (public.create_course('RPC 102','RPC Direct Course','Smoke School')).id as direct_cid \gset
select set_config('test.cid', :'cid', true), set_config('test.direct_cid', :'direct_cid', true);
select (public.create_group(:'cid','RPC Public','Public RPC group',5,'public','pass','{}','weekly',null)).id as public_gid \gset
select (public.create_group(:'cid','RPC Private','Private RPC group',5,'private','mastery','{}','weekly',null)).id as private_gid \gset
select set_config('test.public_gid', :'public_gid', true), set_config('test.private_gid', :'private_gid', true);

do $$
begin
  if not exists(select 1 from public.courses where id=current_setting('test.cid')::uuid and code='RPC 101') then
    raise exception 'create_course effect missing';
  end if;
  if not exists(select 1 from public.groups where id=current_setting('test.public_gid')::uuid and visibility='public') then
    raise exception 'create_group public effect missing';
  end if;
  if not exists(select 1 from public.groups where id=current_setting('test.private_gid')::uuid and visibility='private') then
    raise exception 'create_group private effect missing';
  end if;
  if not exists(select 1 from public.group_members where group_id=current_setting('test.public_gid')::uuid and role='owner' and status='active') then
    raise exception 'create_group owner membership missing';
  end if;
end
$$;
do $$
begin
  if not public.is_group_member(current_setting('test.public_gid')::uuid) then raise exception 'is_group_member result incorrect'; end if;
  if not public.is_group_owner(current_setting('test.public_gid')::uuid) then raise exception 'is_group_owner result incorrect'; end if;
  if not public.shares_group(auth.uid()) then raise exception 'shares_group result incorrect'; end if;
end
$$;

set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$
declare invite text;
begin
  select invite_code into invite from public.groups where id=current_setting('test.private_gid')::uuid;
  if not exists(select 1 from public.group_by_invite(invite) where id=current_setting('test.private_gid')::uuid) then
    raise exception 'group_by_invite result missing';
  end if;
  if public.join_group(current_setting('test.public_gid')::uuid) <> 'joined' then raise exception 'join public result incorrect'; end if;
  if public.join_group(current_setting('test.private_gid')::uuid) <> 'pending' then raise exception 'join private result incorrect'; end if;
  if not exists(select 1 from public.group_members where group_id=current_setting('test.public_gid')::uuid and user_id=auth.uid() and status='active') then
    raise exception 'join_group public effect missing';
  end if;
  if not exists(select 1 from public.group_members where group_id=current_setting('test.private_gid')::uuid and user_id=auth.uid() and status='pending') then
    raise exception 'join_group private effect missing';
  end if;
end
$$;

set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}';
select public.approve_member(:'private_gid','70000000-0000-0000-0000-000000000002');
select set_config('test.private_gid', :'private_gid', true);
do $$ begin
  if not exists(select 1 from public.group_members where group_id=current_setting('test.private_gid')::uuid and user_id='70000000-0000-0000-0000-000000000002' and status='active') then raise exception 'approve_member effect missing'; end if;
end $$;
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000003","role":"authenticated"}';
select public.join_group(:'private_gid');
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}';
select public.decline_member(:'private_gid','70000000-0000-0000-0000-000000000003');
do $$ begin
  if exists(select 1 from public.group_members where group_id=current_setting('test.private_gid')::uuid and user_id='70000000-0000-0000-0000-000000000003') then raise exception 'decline_member did not remove pending member'; end if;
end $$;

select public.save_availability(:'public_gid',array['1:9','3:14']);
select public.save_availability(:'public_gid',array['2:10','4:15']);
select set_config('test.public_gid', :'public_gid', true);
do $$ begin
  if not exists(select 1 from public.availability where group_id=current_setting('test.public_gid')::uuid and user_id='70000000-0000-0000-0000-000000000001' and slots=array['2:10','4:15']) then raise exception 'save_availability insert/update effect missing'; end if;
end $$;

select public.create_session(:'public_gid','RPC One','retrieval',now()+interval '1 day',60,'place','Main Library','none','Initial agenda',array['Read chapter'], '{}'::jsonb) as sid \gset
select public.create_session(:'public_gid','RPC Weekly','jigsaw',now()+interval '2 days',45,'video',null,'weekly','Weekly agenda',array[]::text[],'{}'::jsonb) as weekly_sid \gset
select public.create_session(:'public_gid','RPC Twice','cowork',now()+interval '3 days',90,'place','Study Hall','twice-weekly','Twice agenda',array[]::text[],'{}'::jsonb) as twice_sid \gset
select set_config('test.sid', :'sid', true), set_config('test.weekly_sid', :'weekly_sid', true), set_config('test.twice_sid', :'twice_sid', true);
do $$
begin
  if public.session_group(current_setting('test.sid')::uuid) <> current_setting('test.public_gid')::uuid then raise exception 'session_group result incorrect'; end if;
  if not exists(select 1 from public.sessions where id=current_setting('test.sid')::uuid and recurrence='none' and location='Main Library') then raise exception 'create_session none/place missing'; end if;
  if not exists(select 1 from public.sessions where id=current_setting('test.weekly_sid')::uuid and recurrence='weekly' and video_url like 'https://meet.jit.si/%') then raise exception 'create_session weekly/video missing'; end if;
  if not exists(select 1 from public.sessions where id=current_setting('test.twice_sid')::uuid and recurrence='twice-weekly' and location='Study Hall') then raise exception 'create_session twice-weekly/place missing'; end if;
  if (select count(*) from public.sessions where series_id=(select series_id from public.sessions where id=current_setting('test.weekly_sid')::uuid)) < 2 then raise exception 'weekly recurrence not generated'; end if;
  if (select count(*) from public.sessions where series_id=(select series_id from public.sessions where id=current_setting('test.twice_sid')::uuid)) < 2 then raise exception 'twice-weekly recurrence not generated'; end if;
end
$$;
select public.update_session(:'sid','{"title":"RPC One Updated","agenda":"Changed agenda"}'::jsonb);
do $$ begin
  if not exists(select 1 from public.sessions where id=current_setting('test.sid')::uuid and title='RPC One Updated' and agenda='Changed agenda') then raise exception 'update_session effect missing'; end if;
end $$;

set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.rsvp(:'sid','no');
select public.rsvp(:'sid','maybe');
select set_config('test.sid', :'sid', true);
do $$ begin
  if not exists(select 1 from public.session_rsvps where session_id=current_setting('test.sid')::uuid and user_id=auth.uid() and status='maybe') then raise exception 'rsvp insert/update effect missing'; end if;
end $$;
select public.add_prep_item(:'sid','Bring notes') as prep_id \gset
select set_config('test.prep_id', :'prep_id', true);
select public.toggle_prep(:'prep_id');
do $$ begin
  if not exists(select 1 from public.prep_done where prep_id=current_setting('test.prep_id')::uuid and user_id=auth.uid()) then raise exception 'toggle_prep on effect missing'; end if;
end $$;
select public.toggle_prep(:'prep_id');
do $$ begin
  if exists(select 1 from public.prep_done where prep_id=current_setting('test.prep_id')::uuid and user_id=auth.uid()) then raise exception 'toggle_prep off effect missing'; end if;
end $$;
select public.delete_prep_item(:'prep_id');
do $$ begin
  if exists(select 1 from public.prep_items where id=current_setting('test.prep_id')::uuid) then raise exception 'delete_prep_item effect missing'; end if;
end $$;
select public.start_session(:'sid');
select public.go_to_step(:'sid',2);
select public.pause_session(:'sid',60000);
do $$ begin
  if not exists(select 1 from public.sessions where id=current_setting('test.sid')::uuid and status='live' and current_step=2 and paused_remaining_ms is not null) then raise exception 'start/go_to_step/pause effect missing'; end if;
end $$;
select public.resume_session(:'sid',60000);
select public.update_notes(:'sid','Summary','Questions','Actions');
do $$ begin
  if not exists(select 1 from public.sessions where id=current_setting('test.sid')::uuid and paused_remaining_ms is null and notes_summary='Summary' and notes_open_questions='Questions' and notes_action_items='Actions') then raise exception 'resume/update_notes effect missing'; end if;
end $$;
select public.end_session(:'sid');
do $$ begin
  if not exists(select 1 from public.sessions where id=current_setting('test.sid')::uuid and status='ended') then raise exception 'end_session effect missing'; end if;
end $$;
select public.submit_retro(:'sid',4,'Useful','More time','yes');
select public.submit_retro(:'sid',5,'Very useful','Keep pace','somewhat');
do $$ begin
  if not exists(select 1 from public.retros where session_id=current_setting('test.sid')::uuid and user_id=auth.uid() and rating=5 and helped='Very useful') then raise exception 'submit_retro insert/update effect missing'; end if;
end $$;
do $$ begin
  if not exists(select 1 from public.group_contribution(current_setting('test.public_gid')::uuid) where user_id=auth.uid()) then raise exception 'group_contribution result missing'; end if;
end $$;

insert into public.questions(group_id,topic,prompt,answer,explanation,created_by)
values(:'public_gid','SQL','Direct insert?','Yes','Allowed write',auth.uid()) returning id as question_id \gset
select set_config('test.question_id', :'question_id', true);
update public.questions set answer='Updated answer' where id=:'question_id';
insert into public.quiz_attempts(user_id,question_id,correct) values(auth.uid(),:'question_id',true);
insert into public.messages(group_id,user_id,body) values(:'public_gid',auth.uid(),'Direct message');
update public.profiles set name='Updated RPC Member',onboarded=true where id=auth.uid();
insert into public.course_members(course_id,user_id) values(:'direct_cid',auth.uid());
do $$ begin
  if not exists(select 1 from public.course_members where course_id=current_setting('test.direct_cid')::uuid and user_id=auth.uid()) then raise exception 'direct course_members insert missing'; end if;
end $$;
delete from public.course_members where course_id=:'direct_cid' and user_id=auth.uid();
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}';
update public.groups set pinned_message='Owner update' where id=:'public_gid';
select set_config('test.public_gid', :'public_gid', true);
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and name='Updated RPC Member' and onboarded) then raise exception 'profile allowed update missing'; end if;
  if not exists(select 1 from public.messages where group_id=current_setting('test.public_gid')::uuid and user_id=auth.uid() and body='Direct message') then raise exception 'direct message insert missing'; end if;
  if not exists(select 1 from public.quiz_attempts where user_id=auth.uid() and question_id=current_setting('test.question_id')::uuid) then raise exception 'quiz attempt insert missing'; end if;
  if not exists(select 1 from public.questions where id=current_setting('test.question_id')::uuid and answer='Updated answer') then raise exception 'direct question update missing'; end if;
  if exists(select 1 from public.course_members where course_id=current_setting('test.direct_cid')::uuid and user_id=auth.uid()) then raise exception 'direct course_members delete missing'; end if;
end
$$;
delete from public.questions where id=:'question_id';
do $$ begin
  if exists(select 1 from public.questions where id=current_setting('test.question_id')::uuid) then raise exception 'direct question delete missing'; end if;
end $$;
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$ begin
  if not exists(select 1 from public.groups where id=current_setting('test.public_gid')::uuid and pinned_message='Owner update') then raise exception 'owner group update missing'; end if;
end $$;

select public.transfer_ownership(:'private_gid','70000000-0000-0000-0000-000000000002');
select set_config('test.private_gid', :'private_gid', true);
do $$ begin
  if not exists(select 1 from public.groups where id=current_setting('test.private_gid')::uuid and owner_id='70000000-0000-0000-0000-000000000002') then raise exception 'transfer_ownership effect missing'; end if;
end $$;
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.transfer_ownership(:'private_gid','70000000-0000-0000-0000-000000000001');
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000001","role":"authenticated"}';
select public.remove_member(:'private_gid','70000000-0000-0000-0000-000000000002');
do $$ begin
  if exists(select 1 from public.group_members where group_id=current_setting('test.private_gid')::uuid and user_id='70000000-0000-0000-0000-000000000002') then raise exception 'remove_member effect missing'; end if;
end $$;
select public.delete_session(:'twice_sid');
do $$ begin
  if exists(select 1 from public.sessions where id=current_setting('test.twice_sid')::uuid) then raise exception 'delete_session effect missing'; end if;
end $$;
set local request.jwt.claims='{"sub":"70000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.leave_group(:'public_gid');
do $$ begin
  if exists(select 1 from public.group_members where group_id=current_setting('test.public_gid')::uuid and user_id=auth.uid()) then raise exception 'leave_group effect missing'; end if;
end $$;
rollback;
