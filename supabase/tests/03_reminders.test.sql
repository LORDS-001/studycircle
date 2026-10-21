begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('30000000-0000-0000-0000-000000000001','owner3@example.test','{"name":"Owner"}'),
 ('30000000-0000-0000-0000-000000000002','member3@example.test','{"name":"Member"}'),
 ('30000000-0000-0000-0000-000000000003','member4@example.test','{"name":"Maybe"}');
set local role authenticated;
set local request.jwt.claims='{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated"}';
select (public.create_course('CHEM 101','Chemistry','Reminder U')).id as cid \gset
select public.create_group(:'cid','Reminder Group','',5,'public','pass','{}','',null);
select public.create_session((select id from public.groups where name='Reminder Group'),'Tomorrow','retrieval',now()+interval '24 hours',60,'place','Library','none','',array[]::text[],'{}'::jsonb) as sid \gset
set local request.jwt.claims='{"sub":"30000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.join_group((select id from public.groups where name='Reminder Group'));
select public.rsvp(:'sid','maybe');
set local request.jwt.claims='{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated"}';
select public.join_group((select id from public.groups where name='Reminder Group'));
select public.rsvp(:'sid','no');
set local role service_role;
do $$ declare n int; owner_id uuid:='30000000-0000-0000-0000-000000000001'; sid uuid:=(select id from public.sessions where title='Tomorrow'); begin
 select count(*) into n from public.due_reminders() where session_id=sid and kind='reminder_24h'; if n<>2 then raise exception 'expected yes/maybe recipients, got %',n; end if;
 select count(*) into n from public.due_reminders() where session_id=sid and user_id=owner_id and kind='quorum_warning'; if n<>1 then raise exception 'expected quorum warning to owner'; end if;
 perform public.mark_reminder_sent(sid,'30000000-0000-0000-0000-000000000002','reminder_24h');
 select count(*) into n from public.due_reminders() where session_id=sid and user_id='30000000-0000-0000-0000-000000000002' and kind='reminder_24h'; if n<>0 then raise exception 'sent reminder was not deduplicated'; end if;
end $$;
rollback;
