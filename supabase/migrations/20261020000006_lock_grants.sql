revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles, public.courses, public.course_members, public.groups,
  public.group_members, public.availability, public.sessions, public.session_rsvps,
  public.session_roles, public.prep_items, public.prep_done, public.questions,
  public.quiz_attempts, public.retros, public.messages to authenticated;

grant update(name,school,avatar_url,email_reminders,email_group_activity,email_retros,onboarded)
  on public.profiles to authenticated;
grant update(name,description,max_size,visibility,goal,norms,cadence,exam_date,pinned_message)
  on public.groups to authenticated;
grant insert, delete on public.course_members to authenticated;
grant insert, update, delete on public.questions to authenticated;
grant insert on public.messages, public.quiz_attempts to authenticated;

drop policy if exists sessions_insert on public.sessions;
drop policy if exists sessions_update on public.sessions;
drop policy if exists sessions_delete on public.sessions;

revoke execute on all functions in schema public from anon, public, authenticated;
grant execute on function public.is_group_member(uuid), public.is_group_owner(uuid),
  public.session_group(uuid), public.shares_group(uuid) to authenticated;
grant execute on function
  public.create_course(text,text,text),
  public.create_group(uuid,text,text,integer,public.visibility,public.group_goal,text[],text,date),
  public.join_group(uuid),
  public.group_by_invite(text),
  public.approve_member(uuid,uuid),
  public.decline_member(uuid,uuid),
  public.remove_member(uuid,uuid),
  public.leave_group(uuid),
  public.transfer_ownership(uuid,uuid),
  public.create_session(uuid,text,public.session_template,timestamptz,integer,text,text,public.recurrence,text,text[],jsonb),
  public.update_session(uuid,jsonb),
  public.delete_session(uuid),
  public.rsvp(uuid,public.rsvp_status),
  public.toggle_prep(uuid),
  public.add_prep_item(uuid,text),
  public.delete_prep_item(uuid),
  public.start_session(uuid),
  public.go_to_step(uuid,integer),
  public.pause_session(uuid,integer),
  public.resume_session(uuid,integer),
  public.end_session(uuid),
  public.update_notes(uuid,text,text,text),
  public.submit_retro(uuid,integer,text,text,public.balanced),
  public.save_availability(uuid,text[]),
  public.group_contribution(uuid)
to authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
