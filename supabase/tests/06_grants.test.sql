begin;
insert into auth.users(id,email) values
 ('60000000-0000-0000-0000-000000000001','grant-owner@example.test'),
 ('60000000-0000-0000-0000-000000000002','grant-member@example.test');

set local role authenticated;
set local request.jwt.claims='{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated"}';
select (public.create_course('GRANT 101','Grant Tests','Security U')).id as cid \gset
select (public.create_group(:'cid','Grant Group','',5,'public','pass','{}','',null)).id as gid \gset
select public.create_session(:'gid','Grant Session','retrieval',now()+interval '1 day',60,'place','Library','none','',array[]::text[],'{}'::jsonb) as sid \gset
set local request.jwt.claims='{"sub":"60000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.join_group(:'gid');
do $$
begin
  begin
    update public.sessions set status='ended' where title='Grant Session';
    raise exception 'member directly updated session status';
  exception when insufficient_privilege then
    null;
  end;
end
$$;

set local request.jwt.claims='{"sub":"60000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
begin
  begin
    update public.groups set owner_id='60000000-0000-0000-0000-000000000002' where name='Grant Group';
    raise exception 'owner directly rewrote group owner_id';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.profiles set email='rewritten@example.test' where id=auth.uid();
    raise exception 'user directly rewrote profile email';
  exception when insufficient_privilege then
    null;
  end;

  if not has_table_privilege('authenticated','public.messages','SELECT')
    or not has_table_privilege('authenticated','public.sessions','SELECT')
    or not has_table_privilege('authenticated','public.availability','SELECT')
    or not has_table_privilege('authenticated','public.session_rsvps','SELECT')
    or not has_table_privilege('authenticated','public.group_members','SELECT')
    or not has_table_privilege('authenticated','public.prep_done','SELECT') then
    raise exception 'authenticated SELECT required for Realtime subscriptions was revoked';
  end if;
end
$$;

set local role anon;
do $$
begin
  begin
    perform (select count(*) from public.profiles);
    raise exception 'anon directly selected profiles';
  exception when insufficient_privilege then
    null;
  end;
end
$$;
rollback;
