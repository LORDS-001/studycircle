begin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('10000000-0000-0000-0000-000000000001','ada@example.test','{"full_name":"Ada Lovelace"}'),
 ('10000000-0000-0000-0000-000000000002','grace@example.test','{"name":"Grace Hopper"}'),
 ('10000000-0000-0000-0000-000000000003','alan@example.test','{}'),
 ('10000000-0000-0000-0000-000000000004','linus@example.test','{}'),
 ('10000000-0000-0000-0000-000000000005','margaret@example.test','{}');
do $$ begin
 if (select name from public.profiles where id='10000000-0000-0000-0000-000000000001') <> 'Ada Lovelace' then raise exception 'profile trigger did not use full_name'; end if;
 if (select name from public.profiles where id='10000000-0000-0000-0000-000000000003') <> 'alan' then raise exception 'profile trigger did not fall back to email local-part'; end if;
 if (select hue from public.profiles where id='10000000-0000-0000-0000-000000000001') not between 0 and 359 then raise exception 'invalid generated hue'; end if;
end $$;
set local role authenticated;
set local request.jwt.claims='{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';
select (public.create_course('csc201','Algorithms','University')).id as course_id \gset
do $$ begin
 begin perform public.create_course('CSC 201','Other title',' university '); raise exception 'duplicate course accepted'; exception when sqlstate 'P0001' then if sqlerrm not like '%already exists. Join it instead.%' then raise; end if; end;
end $$;
select public.create_group(:'course_id','Algorithms Circle','',3,'public','pass','{}','weekly',null);
select public.create_group(:'course_id','Private Circle','',5,'private','a','{}','',null);
set local request.jwt.claims='{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$ declare g uuid; begin select id into g from public.groups where name='Algorithms Circle'; if public.join_group(g)<>'joined' then raise exception 'public join should be joined'; end if; if public.join_group(g)<>'already' then raise exception 'repeat join should be already'; end if; end $$;
set local request.jwt.claims='{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}';
do $$ declare g uuid; begin select id into g from public.groups where name='Algorithms Circle'; if public.join_group(g)<>'joined' then raise exception 'second public join should be joined'; end if; end $$;
set local request.jwt.claims='{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}';
do $$ declare g uuid; begin select id into g from public.groups where name='Algorithms Circle'; if public.join_group(g)<>'full' then raise exception 'full group join should be full'; end if; end $$;
set local request.jwt.claims='{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';
set local request.jwt.claims='{"sub":"10000000-0000-0000-0000-000000000005","role":"authenticated"}';
do $$ declare g uuid; begin select id into g from public.groups where name='Private Circle'; if public.join_group(g)<>'pending' then raise exception 'private join should be pending'; end if; end $$;
set local request.jwt.claims='{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';
select public.approve_member((select id from public.groups where name='Private Circle'),'10000000-0000-0000-0000-000000000005');
do $$ begin if (select status from public.group_members gm join public.groups g on g.id=gm.group_id where g.name='Private Circle' and user_id='10000000-0000-0000-0000-000000000005') <> 'active' then raise exception 'pending member not approved'; end if; end $$;
rollback;
