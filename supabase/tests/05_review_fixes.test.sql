begin;
-- test.sh also checks the cron and Edge source contracts when it runs this suite.
insert into auth.users(id,email) values
 ('50000000-0000-0000-0000-000000000001','review-owner@example.test'),
 ('50000000-0000-0000-0000-000000000002','review-member-2@example.test'),
 ('50000000-0000-0000-0000-000000000003','review-member-3@example.test'),
 ('50000000-0000-0000-0000-000000000004','review-member-4@example.test'),
 ('50000000-0000-0000-0000-000000000005','review-member-5@example.test');
set local role authenticated;
set local request.jwt.claims='{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}';
select (public.create_course('REVIEW 101','Review','Review U')).id as cid \gset
select (public.create_group(:'cid','Review Group','',6,'public','pass','{}','',null)).id as gid \gset
select public.create_session(:'gid','Scheduled','retrieval',now()+interval '1 day',60,'place','Library','none','',array[]::text[],'{}'::jsonb) as scheduled_sid \gset
set local test.gid=:'gid';
set local test.scheduled_sid=:'scheduled_sid';

do $$
declare
  t text;
begin
  foreach t in array array['retros','session_roles','session_rsvps','prep_done','availability','prep_items'] loop
    if has_table_privilege('authenticated', format('public.%I', t), 'INSERT')
      or has_table_privilege('authenticated', format('public.%I', t), 'UPDATE')
      or has_table_privilege('authenticated', format('public.%I', t), 'DELETE') then
      raise exception 'authenticated retains direct write privilege on %', t;
    end if;
  end loop;

  if exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename=any(array['retros','session_roles','session_rsvps','prep_done','availability','prep_items'])
      and cmd in ('INSERT','UPDATE','DELETE','ALL')
  ) then
    raise exception 'RPC-governed tables retain direct-write policies';
  end if;

  begin
    insert into public.retros(session_id,user_id,rating,balanced)
    values(current_setting('test.scheduled_sid')::uuid,'50000000-0000-0000-0000-000000000001',5,'yes');
    raise exception 'direct retro insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.session_roles
    set role='scribe'
    where session_id=current_setting('test.scheduled_sid')::uuid
      and user_id='50000000-0000-0000-0000-000000000001';
    raise exception 'direct session role update unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end $$;

do $$
declare
  rpc_source text;
begin
  select pg_get_functiondef('public.start_session(uuid)'::regprocedure) into rpc_source;
  if rpc_source not like '%Session has ended%' then
    raise exception 'start_session does not reject ended sessions';
  end if;
  select pg_get_functiondef('public.go_to_step(uuid,integer)'::regprocedure) into rpc_source;
  if rpc_source not like '%Session must be live%' or rpc_source not like '%Step must be non-negative%' then
    raise exception 'go_to_step is missing status or non-negative step validation';
  end if;
end $$;

do $$
declare
  i int;
  sid uuid;
  null_count int;
  members uuid[] := array[
    '50000000-0000-0000-0000-000000000002'::uuid,
    '50000000-0000-0000-0000-000000000003'::uuid,
    '50000000-0000-0000-0000-000000000004'::uuid,
    '50000000-0000-0000-0000-000000000005'::uuid
  ];
begin
  for i in 1..4 loop
    perform set_config('request.jwt.claims',jsonb_build_object('sub',members[i],'role','authenticated')::text,true);
    perform public.join_group(current_setting('test.gid')::uuid);
  end loop;

  perform set_config('request.jwt.claims','{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
  for i in 1..5 loop
    sid := public.create_session(current_setting('test.gid')::uuid,'Rotation '||i,'retrieval',now()+interval '2 days',60,'place','Library','none','',array[]::text[],'{}'::jsonb);
    perform public.start_session(sid);
  end loop;

  select count(*) into null_count
  from public.group_members gm
  where gm.group_id=current_setting('test.gid')::uuid
    and gm.status='active'
    and (select count(*) from public.session_roles sr join public.sessions s on s.id=sr.session_id
         where sr.user_id=gm.user_id and s.title like 'Rotation %' and sr.role is null)=1;
  if null_count<>5 then
    raise exception 'each of five members must receive null exactly once across five started sessions; got %', null_count;
  end if;
end $$;

set local request.jwt.claims='{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare
  sid uuid := current_setting('test.scheduled_sid')::uuid;
begin
  begin
    perform public.go_to_step(sid,1);
    raise exception 'go_to_step accepted scheduled session';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Session must be live%' then raise; end if;
  end;
  begin
    perform public.go_to_step(sid,-1);
    raise exception 'go_to_step accepted negative step';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Step must be non-negative%' then raise; end if;
  end;
  perform public.end_session(sid);
  begin
    perform public.start_session(sid);
    raise exception 'start_session accepted ended session';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Session has ended%' then raise; end if;
  end;
end $$;

do $$
declare
  sid uuid;
  prep_id uuid;
begin
  sid := public.create_session(current_setting('test.gid')::uuid,'Prep RPC','retrieval',now()+interval '3 days',60,'place','Library','none','',array[]::text[],'{}'::jsonb);
  prep_id := public.add_prep_item(sid,'Read chapter');
  if not exists(select 1 from public.prep_items where id=prep_id and text='Read chapter') then
    raise exception 'add_prep_item did not insert item';
  end if;
  perform public.delete_prep_item(prep_id);
  if exists(select 1 from public.prep_items where id=prep_id) then
    raise exception 'delete_prep_item did not delete item';
  end if;
end $$;

do $$
begin
  begin
    update public.groups set max_size=4 where id=current_setting('test.gid')::uuid;
    raise exception 'group max_size reduced below active member count';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'max_size cannot be below active member count%' then raise; end if;
  end;
end $$;
rollback;
