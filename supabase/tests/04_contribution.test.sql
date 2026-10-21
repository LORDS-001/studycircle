begin;
insert into auth.users(id,email) values ('40000000-0000-0000-0000-000000000001','owner4@example.test'),('40000000-0000-0000-0000-000000000002','member5@example.test');
set local role authenticated;
set local request.jwt.claims='{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated"}';
select (public.create_course('MATH 100','Math','Contribution U')).id as cid \gset
select public.create_group(:'cid','Contribution Group','',5,'public','pass','{}','',null);
select public.create_session((select id from public.groups where name='Contribution Group'),'Teach limits','jigsaw',now()+interval '1 day',60,'place','Room','none','',array[]::text[],'{"40000000-0000-0000-0000-000000000001":"Limits"}'::jsonb) as sid \gset
set local request.jwt.claims='{"sub":"40000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.join_group((select id from public.groups where name='Contribution Group'));
select public.rsvp(:'sid','maybe');
set local request.jwt.claims='{"sub":"40000000-0000-0000-0000-000000000001","role":"authenticated"}';
select public.end_session(:'sid');
insert into public.questions(group_id,topic,prompt,answer,created_by) values((select id from public.groups where name='Contribution Group'),'Limits','Q','A','40000000-0000-0000-0000-000000000001');
select public.submit_retro(:'sid',4,'good','more examples','somewhat');
do $$ declare c record; begin
 select * into c from public.group_contribution((select id from public.groups where name='Contribution Group')) where user_id='40000000-0000-0000-0000-000000000001'; if c.attended<>1 or c.scheduled<>1 or c.rsvp_reliability<>100 or c.questions<>1 or c.taught<>array['Limits'] or c.retros<>1 then raise exception 'owner contribution mismatch: %',row_to_json(c); end if;
 select * into c from public.group_contribution((select id from public.groups where name='Contribution Group')) where user_id='40000000-0000-0000-0000-000000000002'; if c.attended<>0 or c.scheduled<>1 or c.rsvp_reliability<>100 or c.questions<>0 or c.retros<>0 then raise exception 'member contribution mismatch: %',row_to_json(c); end if;
end $$;
set local request.jwt.claims='{"sub":"00000000-0000-0000-0000-00000000a001","role":"authenticated"}';
do $$ declare c record; begin
 if not exists(select 1 from public.groups where id='00000000-0000-0000-0000-00000000c001') then raise notice 'seed contribution parity skipped: seed.sql is absent'; return; end if;
 select * into c from public.group_contribution('00000000-0000-0000-0000-00000000c001') where user_id='00000000-0000-0000-0000-00000000a001';
 if c.attended<>2 or c.scheduled<>2 or c.rsvp_reliability<>75 or c.questions<>2 or c.taught<>array['Heapify'] or c.retros<>1 then raise exception 'seed Ada contribution mismatch: %',row_to_json(c); end if;
 select * into c from public.group_contribution('00000000-0000-0000-0000-00000000c001') where user_id='00000000-0000-0000-0000-00000000a002';
 if c.attended<>2 or c.scheduled<>2 or c.rsvp_reliability<>100 or c.questions<>3 or c.taught<>array['Insert and sift-up'] or c.retros<>2 then raise exception 'seed Tunde contribution mismatch: %',row_to_json(c); end if;
end $$;
rollback;
