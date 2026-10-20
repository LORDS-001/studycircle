begin;
insert into auth.users(id,email) values
 ('20000000-0000-0000-0000-000000000001','owner@example.test'),
 ('20000000-0000-0000-0000-000000000002','member@example.test'),
 ('20000000-0000-0000-0000-000000000003','outsider@example.test');
set local role authenticated;
set local request.jwt.claims='{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}';
select (public.create_course('BIO 101','Biology','Test U')).id as cid \gset
select public.create_group(:'cid','Cell Study','',6,'public','pass','{}','',null);
select public.create_group(:'cid','Exam Circle','',6,'public','pass','{}','',current_date+9);
select public.create_session((select id from public.groups where name='Cell Study'),'One off','retrieval',now()+interval '1 day',60,'place','Library','none','',array['Read chapter'], '{}'::jsonb) as one_id \gset
select public.create_session((select id from public.groups where name='Cell Study'),'Weekly','retrieval',now()+interval '1 day',60,'video',null,'weekly','',array[]::text[], '{}'::jsonb) as weekly_id \gset
select public.create_session((select id from public.groups where name='Cell Study'),'Twice','cowork',now()+interval '1 day',90,'place','Room 2','twice-weekly','',array[]::text[], '{}'::jsonb) as twice_id \gset
select public.create_session((select id from public.groups where name='Exam Circle'),'Exam','jigsaw',now()+interval '1 day',75,'place','Room 3','weekly','',array[]::text[], '{}'::jsonb) as exam_id \gset
do $$ declare gid uuid; sid uuid; begin
 select id into gid from public.groups where name='Cell Study';
 if (select count(*) from public.sessions where title='One off')<>1 then raise exception 'none recurrence count wrong'; end if;
 if (select count(*) from public.sessions where title='Weekly')<>7 then raise exception 'weekly six week count wrong: %',(select count(*) from public.sessions where title='Weekly'); end if;
 if (select count(*) from public.sessions where title='Twice')<>13 then raise exception 'twice-weekly count wrong'; end if;
 if (select count(*) from public.sessions where title='Exam')<>2 then raise exception 'exam cut-off count wrong'; end if;
 if (select count(distinct video_url) from public.sessions where title='Weekly')<>1 or (select min(video_url) from public.sessions where title='Weekly') not like 'https://meet.jit.si/studycircle-%' then raise exception 'video URL not shared by series'; end if;
 if (select count(*) from public.session_rsvps r join public.sessions s on s.id=r.session_id where s.title='One off' and r.status='yes')<>1 then raise exception 'creator not RSVP yes'; end if;
 select id into sid from public.sessions where title='One off';
 begin perform public.submit_retro(sid,5,'good','more quiz','yes'); raise exception 'retro allowed before ended'; exception when sqlstate 'P0001' then if sqlerrm<>'Session must be ended before a retro' then raise; end if; end;
end $$;
select public.start_session((select id from public.sessions where title='One off'));
set local role postgres;
update public.sessions set step_started_at=now()-interval '3 seconds' where title='One off';
set local role authenticated;
set local request.jwt.claims='{"sub":"20000000-0000-0000-0000-000000000001","role":"authenticated"}';
select public.pause_session((select id from public.sessions where title='One off'),10000);
do $$ begin if (select paused_remaining_ms from public.sessions where title='One off') not between 6000 and 8000 then raise exception 'pause timer arithmetic wrong'; end if; end $$;
select public.resume_session((select id from public.sessions where title='One off'),10000);
do $$ begin if (select abs(extract(epoch from ((now()-step_started_at)-interval '3 seconds'))*1000)::int from public.sessions where title='One off')>1000 then raise exception 'resume timer arithmetic wrong'; end if; end $$;
select public.end_session((select id from public.sessions where title='One off'));
select public.submit_retro((select id from public.sessions where title='One off'),5,'useful','more quizzes','yes');
do $$ begin if not exists(select 1 from public.retros where session_id=(select id from public.sessions where title='One off')) then raise exception 'ended retro not stored'; end if; end $$;
insert into public.questions(group_id,topic,prompt,answer,created_by) values((select id from public.groups where name='Cell Study'),'Cells','Q?','A','20000000-0000-0000-0000-000000000001');
set local request.jwt.claims='{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.join_group((select id from public.groups where name='Cell Study'));
select public.create_session((select id from public.groups where name='Cell Study'),'Role rotation','retrieval',now()+interval '2 days',60,'place','Library','none','',array[]::text[],'{}'::jsonb);
do $$ begin
 if (select role from public.session_roles sr join public.sessions s on s.id=sr.session_id where s.title='Role rotation' and sr.user_id='20000000-0000-0000-0000-000000000001') <> 'timekeeper' then raise exception 'role rotation did not advance for started session'; end if;
 if (select role from public.session_roles sr join public.sessions s on s.id=sr.session_id where s.title='Role rotation' and sr.user_id='20000000-0000-0000-0000-000000000002') <> 'facilitator' then raise exception 'role rotation ordering wrong'; end if;
end $$;
set local request.jwt.claims='{"sub":"20000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$ declare q uuid; begin select id into q from public.questions limit 1; insert into public.quiz_attempts(user_id,question_id,correct) values(auth.uid(),q,true); end $$;
set local request.jwt.claims='{"sub":"20000000-0000-0000-0000-000000000003","role":"authenticated"}';
do $$ begin
 if (select count(*) from public.sessions where title='One off')<>0 then raise exception 'nonmember read sessions'; end if;
 if (select count(*) from public.messages)<>0 then raise exception 'nonmember read messages'; end if;
 if (select count(*) from public.questions)<>0 then raise exception 'nonmember read questions'; end if;
 if (select count(*) from public.quiz_attempts)<>0 then raise exception 'quiz attempts not isolated'; end if;
end $$;
rollback;
