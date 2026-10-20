do $$ begin
  if not exists(select 1 from pg_publication where pubname='supabase_realtime') then create publication supabase_realtime; end if;
  alter table public.sessions replica identity full;
  alter table public.availability replica identity full;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then alter publication supabase_realtime add table public.messages; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sessions') then alter publication supabase_realtime add table public.sessions; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='availability') then alter publication supabase_realtime add table public.availability; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='session_rsvps') then alter publication supabase_realtime add table public.session_rsvps; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='group_members') then alter publication supabase_realtime add table public.group_members; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='prep_done') then alter publication supabase_realtime add table public.prep_done; end if;
end $$;
