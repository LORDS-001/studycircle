-- Demo data for StudyCircle, mirroring web/src/lib/seed.ts.
--
-- Dates are relative to now(), like the helpers in seed.ts:
--   at(dayOffset, h, m) = date_trunc('day', now()) + dayOffset days + h hours + m minutes
--   ago(days)           = now() - days
--
-- Old id -> uuid map
--   users
--     u-ada     00000000-0000-0000-0000-00000000a001
--     u-tunde   00000000-0000-0000-0000-00000000a002
--     u-chioma  00000000-0000-0000-0000-00000000a003
--     u-kemi    00000000-0000-0000-0000-00000000a004
--     u-ife     00000000-0000-0000-0000-00000000a005
--     u-zainab  00000000-0000-0000-0000-00000000a006
--     u-david   00000000-0000-0000-0000-00000000a007
--     u-fola    00000000-0000-0000-0000-00000000a008
--   courses
--     c-csc201  00000000-0000-0000-0000-00000000b001
--     c-mth201  00000000-0000-0000-0000-00000000b002
--     c-csc205  00000000-0000-0000-0000-00000000b003
--     c-sta211  00000000-0000-0000-0000-00000000b004
--   groups
--     g-trees      00000000-0000-0000-0000-00000000c001
--     g-nightowls  00000000-0000-0000-0000-00000000c002
--     g-matrix     00000000-0000-0000-0000-00000000c003
--     g-proofs     00000000-0000-0000-0000-00000000c004
--   series
--     s-series-trees   00000000-0000-0000-0000-00000000d001
--     s-series-matrix  00000000-0000-0000-0000-00000000d002
--   sessions
--     s-past-1       00000000-0000-0000-0000-00000000e001
--     s-past-2       00000000-0000-0000-0000-00000000e002
--     s-next         00000000-0000-0000-0000-00000000e003
--     s-next-2       00000000-0000-0000-0000-00000000e004
--     s-matrix-next  00000000-0000-0000-0000-00000000e005
--   prep items (ids are only unique within a session in seed.ts)
--     s-past-1/p1       00000000-0000-0000-0000-00000000f001
--     s-past-2/p1       00000000-0000-0000-0000-00000000f002
--     s-next/p1         00000000-0000-0000-0000-00000000f003
--     s-next/p2         00000000-0000-0000-0000-00000000f004
--     s-next-2/p1       00000000-0000-0000-0000-00000000f005
--     s-matrix-next/p1  00000000-0000-0000-0000-00000000f006
--   questions
--     q1   00000000-0000-0000-0000-000000001001
--     q2   00000000-0000-0000-0000-000000001002
--     q3   00000000-0000-0000-0000-000000001003
--     q4   00000000-0000-0000-0000-000000001004
--     q5   00000000-0000-0000-0000-000000001005
--     q6   00000000-0000-0000-0000-000000001006
--     q7   00000000-0000-0000-0000-000000001007
--     q8   00000000-0000-0000-0000-000000001008
--     q9   00000000-0000-0000-0000-000000001009
--     q10  00000000-0000-0000-0000-000000001010
--     q11  00000000-0000-0000-0000-000000001011
--     q12  00000000-0000-0000-0000-000000001012
--   quiz attempts
--     a1   00000000-0000-0000-0000-000000002001
--     a2   00000000-0000-0000-0000-000000002002
--     a3   00000000-0000-0000-0000-000000002003
--     a4   00000000-0000-0000-0000-000000002004
--     a5   00000000-0000-0000-0000-000000002005
--     a6   00000000-0000-0000-0000-000000002006
--   messages
--     m1   00000000-0000-0000-0000-000000003001
--     m2   00000000-0000-0000-0000-000000003002
--     m3   00000000-0000-0000-0000-000000003003
--     m4   00000000-0000-0000-0000-000000003004
--     m5   00000000-0000-0000-0000-000000003005
--     m6   00000000-0000-0000-0000-000000003006

begin;

-- Users. The auth.users insert trigger creates the matching profiles row
-- (name from raw_user_meta_data.full_name, email, random hue).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000a001', 'ada@unilag.edu.ng',    '{"full_name":"Ada Okafor"}'),    -- u-ada
  ('00000000-0000-0000-0000-00000000a002', 'tunde@unilag.edu.ng',  '{"full_name":"Tunde Bakare"}'),  -- u-tunde
  ('00000000-0000-0000-0000-00000000a003', 'chioma@unilag.edu.ng', '{"full_name":"Chioma Eze"}'),    -- u-chioma
  ('00000000-0000-0000-0000-00000000a004', 'kemi@unilag.edu.ng',   '{"full_name":"Kemi Adeyemi"}'),  -- u-kemi
  ('00000000-0000-0000-0000-00000000a005', 'ife@unilag.edu.ng',    '{"full_name":"Ifeanyi Obi"}'),   -- u-ife
  ('00000000-0000-0000-0000-00000000a006', 'zainab@unilag.edu.ng', '{"full_name":"Zainab Musa"}'),   -- u-zainab
  ('00000000-0000-0000-0000-00000000a007', 'david@unilag.edu.ng',  '{"full_name":"David Olatunji"}'),-- u-david
  ('00000000-0000-0000-0000-00000000a008', 'fola@unilag.edu.ng',   '{"full_name":"Folake Ajayi"}');  -- u-fola

-- school, hue and onboarding are not part of the auth.users payload; the
-- trigger's random hue is overridden here. email prefs all default to true,
-- which matches `prefs` in seed.ts.
update profiles as p
set school = v.school,
    hue = v.hue,
    onboarded = true
from (values
  ('00000000-0000-0000-0000-00000000a001'::uuid, 'University of Lagos', 168), -- u-ada
  ('00000000-0000-0000-0000-00000000a002'::uuid, 'University of Lagos', 220), -- u-tunde
  ('00000000-0000-0000-0000-00000000a003'::uuid, 'University of Lagos', 28),  -- u-chioma
  ('00000000-0000-0000-0000-00000000a004'::uuid, 'University of Lagos', 330), -- u-kemi
  ('00000000-0000-0000-0000-00000000a005'::uuid, 'University of Lagos', 260), -- u-ife
  ('00000000-0000-0000-0000-00000000a006'::uuid, 'University of Lagos', 120), -- u-zainab
  ('00000000-0000-0000-0000-00000000a007'::uuid, 'University of Lagos', 0),   -- u-david
  ('00000000-0000-0000-0000-00000000a008'::uuid, 'University of Lagos', 290)  -- u-fola
) as v(id, school, hue)
where p.id = v.id;

insert into courses (id, code, title, school, created_by) values
  ('00000000-0000-0000-0000-00000000b001', 'CSC 201', 'Data Structures',   'University of Lagos', '00000000-0000-0000-0000-00000000a001'), -- c-csc201 / u-ada
  ('00000000-0000-0000-0000-00000000b002', 'MTH 201', 'Linear Algebra',    'University of Lagos', '00000000-0000-0000-0000-00000000a006'), -- c-mth201 / u-zainab
  ('00000000-0000-0000-0000-00000000b003', 'CSC 205', 'Operating Systems', 'University of Lagos', '00000000-0000-0000-0000-00000000a007'), -- c-csc205 / u-david
  ('00000000-0000-0000-0000-00000000b004', 'STA 211', 'Probability I',     'University of Lagos', '00000000-0000-0000-0000-00000000a008'); -- c-sta211 / u-fola

-- courseMembers has no joinedAt in seed.ts; joined_at uses its default (now()).
insert into course_members (course_id, user_id) values
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a001'), -- c-csc201 / u-ada
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a002'), -- c-csc201 / u-tunde
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a003'), -- c-csc201 / u-chioma
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a004'), -- c-csc201 / u-kemi
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a005'), -- c-csc201 / u-ife
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a007'), -- c-csc201 / u-david
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a008'), -- c-csc201 / u-fola
  ('00000000-0000-0000-0000-00000000b001', '00000000-0000-0000-0000-00000000a006'), -- c-csc201 / u-zainab
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a001'), -- c-mth201 / u-ada
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a006'), -- c-mth201 / u-zainab
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a002'), -- c-mth201 / u-tunde
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a008'), -- c-mth201 / u-fola
  ('00000000-0000-0000-0000-00000000b002', '00000000-0000-0000-0000-00000000a007'), -- c-mth201 / u-david
  ('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000a007'), -- c-csc205 / u-david
  ('00000000-0000-0000-0000-00000000b003', '00000000-0000-0000-0000-00000000a005'), -- c-csc205 / u-ife
  ('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000a008'), -- c-sta211 / u-fola
  ('00000000-0000-0000-0000-00000000b004', '00000000-0000-0000-0000-00000000a004'); -- c-sta211 / u-kemi

-- examDate is a date column, so the 09:00/13:00 time in at(34, 9) / at(41, 13) is dropped.
insert into groups (id, course_id, name, description, max_size, visibility, goal, norms, cadence, exam_date, invite_code, owner_id, pinned_message, created_at) values
  (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000b001',
    'Trees and Graphs Crew',
    'Second-years working through CSC 201 one chapter a week, with a mock exam before the real one.',
    5,
    'private',
    'a',
    array['Come prepared', 'Cameras on', 'Phones face down', 'Ask “why?” out loud'],
    'Twice weekly',
    (date_trunc('day', now()) + interval '34 days')::date,
    'TREE-4KX9',
    '00000000-0000-0000-0000-00000000a001',
    'Bring 2 questions from Chapter 4 to the next Retrieval Round.',
    now() - interval '28 days'
  ), -- g-trees / u-ada
  (
    '00000000-0000-0000-0000-00000000c002',
    '00000000-0000-0000-0000-00000000b001',
    'Night Owls',
    'Late-evening co-working for people with day jobs. Quiet focus, short check-ins.',
    6,
    'public',
    'b-plus',
    array['Mics off during focus', 'Share one goal'],
    'Weekly',
    (date_trunc('day', now()) + interval '34 days')::date,
    'OWLS-77QP',
    '00000000-0000-0000-0000-00000000a007',
    null,
    now() - interval '18 days'
  ), -- g-nightowls / u-david
  (
    '00000000-0000-0000-0000-00000000c003',
    '00000000-0000-0000-0000-00000000b002',
    'Eigen Friends',
    'Working every past paper from the last five years before the final.',
    4,
    'public',
    'b-plus',
    array['Attempt problems before the session', 'No phones'],
    'Weekly',
    (date_trunc('day', now()) + interval '41 days')::date,
    'EIGN-2M8D',
    '00000000-0000-0000-0000-00000000a006',
    null,
    now() - interval '16 days'
  ), -- g-matrix / u-zainab
  (
    '00000000-0000-0000-0000-00000000c004',
    '00000000-0000-0000-0000-00000000b002',
    'Proof Club',
    'For people who want to really understand the proofs, not just memorise them.',
    5,
    'public',
    'mastery',
    array['Explain in your own words'],
    'Twice weekly',
    null,
    'PRUF-91LA',
    '00000000-0000-0000-0000-00000000a007',
    null,
    now() - interval '6 days'
  ); -- g-proofs / u-david

-- `m(userId, role, days)` in seed.ts: status is always active.
insert into group_members (group_id, user_id, role, status, joined_at) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a001', 'owner',  'active', now() - interval '28 days'), -- g-trees / u-ada
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a002', 'member', 'active', now() - interval '26 days'), -- g-trees / u-tunde
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a003', 'member', 'active', now() - interval '25 days'), -- g-trees / u-chioma
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a004', 'member', 'active', now() - interval '22 days'), -- g-trees / u-kemi
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a005', 'member', 'active', now() - interval '12 days'), -- g-trees / u-ife
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000a007', 'owner',  'active', now() - interval '20 days'), -- g-nightowls / u-david
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000a008', 'member', 'active', now() - interval '20 days'), -- g-nightowls / u-fola
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000a006', 'member', 'active', now() - interval '20 days'), -- g-nightowls / u-zainab
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000a006', 'owner',  'active', now() - interval '20 days'), -- g-matrix / u-zainab
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000a001', 'member', 'active', now() - interval '15 days'), -- g-matrix / u-ada
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000a002', 'member', 'active', now() - interval '14 days'), -- g-matrix / u-tunde
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000a008', 'member', 'active', now() - interval '9 days'),  -- g-matrix / u-fola
  ('00000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-00000000a007', 'owner',  'active', now() - interval '20 days'), -- g-proofs / u-david
  ('00000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-00000000a008', 'member', 'active', now() - interval '20 days'); -- g-proofs / u-fola

-- Weekday 0-6 (Mon-Sun), slot 0-31 (07:00 + 30 min * slot).
insert into availability (group_id, user_id, slots, updated_at) values
  (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000a001',
    array[
      '0:20','0:21','0:22','0:23','0:24','0:25','0:26','0:27',
      '1:22','1:23','1:24','1:25','1:26','1:27',
      '3:20','3:21','3:22','3:23','3:24','3:25','3:26','3:27',
      '5:6','5:7','5:8','5:9','5:10','5:11','5:12','5:13'
    ],
    now() - interval '2 days'
  ), -- g-trees / u-ada
  (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000a002',
    array[
      '0:18','0:19','0:20','0:21','0:22','0:23','0:24','0:25',
      '3:20','3:21','3:22','3:23','3:24','3:25','3:26','3:27','3:28','3:29',
      '4:16','4:17','4:18','4:19','4:20','4:21','4:22','4:23',
      '5:4','5:5','5:6','5:7','5:8','5:9','5:10','5:11'
    ],
    now() - interval '3 days'
  ), -- g-trees / u-tunde
  (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000a003',
    array[
      '1:20','1:21','1:22','1:23','1:24','1:25',
      '3:21','3:22','3:23','3:24','3:25','3:26',
      '5:6','5:7','5:8','5:9',
      '6:14','6:15','6:16','6:17','6:18','6:19'
    ],
    now() - interval '4 days'
  ), -- g-trees / u-chioma
  (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000a004',
    array[
      '0:22','0:23','0:24','0:25','0:26','0:27',
      '3:22','3:23','3:24','3:25','3:26','3:27',
      '5:8','5:9','5:10','5:11','5:12','5:13'
    ],
    now() - interval '1 day'
  ), -- g-trees / u-kemi
  (
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000a005',
    array[
      '2:18','2:19','2:20','2:21','2:22','2:23',
      '3:22','3:23','3:24','3:25','3:26','3:27','3:28','3:29',
      '5:6','5:7','5:8','5:9','5:10','5:11'
    ],
    now() - interval '5 days'
  ); -- g-trees / u-ife

-- created_by is not in seed.ts; sessions are attributed to the group owner.
insert into sessions (
  id, group_id, series_id, title, template, starts_at, duration_min, location, video_url,
  recurrence, agenda, status, current_step, step_started_at, paused_remaining_ms,
  notes_summary, notes_open_questions, notes_action_items, notes_updated_at, created_by
) values
  (
    '00000000-0000-0000-0000-00000000e001',
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000d001',
    'Binary search trees',
    'retrieval',
    date_trunc('day', now()) - interval '8 days' + interval '18 hours',
    60,
    'Video call',
    'https://meet.jit.si/studycircle-trees-8f3k2m9q1x',
    'twice-weekly',
    'BST insert, delete and the three traversals.',
    'ended',
    0,
    null,
    null,
    'Covered insert and delete. Deleting a node with two children still trips people up: use the in-order successor.',
    'Why is the worst case O(n)? What makes a tree balanced?',
    E'Tunde: add 3 questions on traversals.\nKemi: find a good AVL rotation visual.',
    date_trunc('day', now()) - interval '8 days' + interval '19 hours',
    '00000000-0000-0000-0000-00000000a001'
  ), -- s-past-1 / g-trees
  (
    '00000000-0000-0000-0000-00000000e002',
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000d001',
    'Heaps and priority queues',
    'jigsaw',
    date_trunc('day', now()) - interval '4 days' + interval '18 hours',
    75,
    'Faculty of Science, Room 204',
    null,
    'twice-weekly',
    'Each person teaches one heap operation.',
    'ended',
    0,
    null,
    null,
    'Everyone taught their operation. Heapify in O(n) was the big surprise.',
    'Proof that build-heap is O(n), not O(n log n).',
    'Ada: share the build-heap proof.',
    date_trunc('day', now()) - interval '4 days' + interval '19 hours' + interval '20 minutes',
    '00000000-0000-0000-0000-00000000a001'
  ), -- s-past-2 / g-trees
  (
    '00000000-0000-0000-0000-00000000e003',
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000d001',
    'Trees and graphs',
    'retrieval',
    date_trunc('day', now()) + interval '1 day' + interval '18 hours',
    60,
    'Video call',
    'https://meet.jit.si/studycircle-trees-r7c2x0vm4p',
    'twice-weekly',
    'Graph representations, BFS and DFS. Then the hardest tree questions from the bank.',
    'scheduled',
    0,
    null,
    null,
    '',
    '',
    '',
    null,
    '00000000-0000-0000-0000-00000000a001'
  ), -- s-next / g-trees
  (
    '00000000-0000-0000-0000-00000000e004',
    '00000000-0000-0000-0000-00000000c001',
    '00000000-0000-0000-0000-00000000d001',
    'Shortest paths',
    'jigsaw',
    date_trunc('day', now()) + interval '5 days' + interval '18 hours',
    75,
    'Video call',
    'https://meet.jit.si/studycircle-trees-k2p9w8qa3z',
    'twice-weekly',
    'Dijkstra, Bellman-Ford, Floyd-Warshall and topological sort.',
    'scheduled',
    0,
    null,
    null,
    '',
    '',
    '',
    null,
    '00000000-0000-0000-0000-00000000a001'
  ), -- s-next-2 / g-trees
  (
    '00000000-0000-0000-0000-00000000e005',
    '00000000-0000-0000-0000-00000000c003',
    '00000000-0000-0000-0000-00000000d002',
    'Past paper: 2023',
    'cowork',
    date_trunc('day', now()) + interval '2 days' + interval '16 hours',
    90,
    'Main Library, 2nd floor',
    null,
    'weekly',
    'Work the 2023 paper under exam conditions, then mark together.',
    'scheduled',
    0,
    null,
    null,
    '',
    '',
    '',
    null,
    '00000000-0000-0000-0000-00000000a006'
  ); -- s-matrix-next / g-matrix

insert into session_rsvps (session_id, user_id, status) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a001', 'yes'),   -- s-past-1 / u-ada
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a002', 'yes'),   -- s-past-1 / u-tunde
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a003', 'yes'),   -- s-past-1 / u-chioma
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a004', 'maybe'), -- s-past-1 / u-kemi
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a005', 'yes'),   -- s-past-1 / u-ife
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a001', 'yes'),   -- s-past-2 / u-ada
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a002', 'yes'),   -- s-past-2 / u-tunde
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a003', 'yes'),   -- s-past-2 / u-chioma
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a004', 'no'),    -- s-past-2 / u-kemi
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a005', 'yes'),   -- s-past-2 / u-ife
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a002', 'yes'),   -- s-next / u-tunde
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a003', 'yes'),   -- s-next / u-chioma
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a004', 'maybe'), -- s-next / u-kemi
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a005', 'yes'),   -- s-next / u-ife
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000a001', 'yes'),   -- s-next-2 / u-ada
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000a002', 'maybe'), -- s-next-2 / u-tunde
  ('00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-00000000a006', 'yes'),   -- s-matrix-next / u-zainab
  ('00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-00000000a002', 'yes'),   -- s-matrix-next / u-tunde
  ('00000000-0000-0000-0000-00000000e005', '00000000-0000-0000-0000-00000000a008', 'maybe'); -- s-matrix-next / u-fola

-- roles + jigsawTopics share the (session_id, user_id) key.
insert into session_roles (session_id, user_id, role, jigsaw_topic) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a001', 'facilitator', null),
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a002', 'timekeeper', null),
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a003', 'scribe', null),
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a004', 'questioner', null),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a001', null, 'Heapify'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a002', 'facilitator', 'Insert and sift-up'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a003', 'timekeeper', 'Extract-min'),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a004', 'scribe', null),
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a005', 'questioner', 'Heapsort'),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a001', 'questioner', null),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a003', 'facilitator', null),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a004', 'timekeeper', null),
  ('00000000-0000-0000-0000-00000000e003', '00000000-0000-0000-0000-00000000a005', 'scribe', null),
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000a001', 'scribe', 'Dijkstra'),
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000a002', 'questioner', 'Bellman-Ford'),
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000a003', null, 'Floyd-Warshall'),
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000a004', 'facilitator', 'Topological sort'),
  ('00000000-0000-0000-0000-00000000e004', '00000000-0000-0000-0000-00000000a005', 'timekeeper', 'Minimum spanning trees');

-- position is 1-based, preserving the order of each prep array.
insert into prep_items (id, session_id, text, position) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000e001', 'Read Chapter 3', 1),
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000e002', 'Prepare your 10-minute explanation', 1),
  ('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000e003', 'Bring 2 questions from Chapter 4', 1),
  ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000e003', 'Skim the BFS/DFS lecture slides', 2),
  ('00000000-0000-0000-0000-00000000f005', '00000000-0000-0000-0000-00000000e004', 'Prepare your subtopic', 1),
  ('00000000-0000-0000-0000-00000000f006', '00000000-0000-0000-0000-00000000e005', 'Print the 2023 paper', 1);

insert into prep_done (prep_id, user_id) values
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000a001'), -- s-past-1/p1 / u-ada
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000a002'), -- s-past-1/p1 / u-tunde
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000a003'), -- s-past-1/p1 / u-chioma
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000a004'), -- s-past-1/p1 / u-kemi
  ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000a005'), -- s-past-1/p1 / u-ife
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000a001'), -- s-past-2/p1 / u-ada
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000a002'), -- s-past-2/p1 / u-tunde
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000a003'), -- s-past-2/p1 / u-chioma
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-00000000a005'), -- s-past-2/p1 / u-ife
  ('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000a002'), -- s-next/p1 / u-tunde
  ('00000000-0000-0000-0000-00000000f003', '00000000-0000-0000-0000-00000000a003'), -- s-next/p1 / u-chioma
  ('00000000-0000-0000-0000-00000000f004', '00000000-0000-0000-0000-00000000a003'), -- s-next/p2 / u-chioma
  ('00000000-0000-0000-0000-00000000f006', '00000000-0000-0000-0000-00000000a006'); -- s-matrix-next/p1 / u-zainab

-- seed.ts calls ago(Math.floor(Math.random() * 20) + 1); the days are pinned
-- here (1-20) so the seed is reproducible.
insert into questions (id, group_id, topic, prompt, answer, explanation, created_by, created_at) values
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-00000000c001', 'Trees', 'What is the worst-case time to search an unbalanced BST with n nodes?', 'O(n)', 'If keys arrive in sorted order the tree degenerates into a linked list.', '00000000-0000-0000-0000-00000000a002', now() - interval '18 days'), -- q1 / u-tunde
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-00000000c001', 'Trees', 'Which traversal of a BST visits keys in sorted order?', 'In-order traversal (left, node, right).', null, '00000000-0000-0000-0000-00000000a002', now() - interval '17 days'), -- q2 / u-tunde
  ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-00000000c001', 'Trees', 'When deleting a BST node with two children, what replaces it?', 'Its in-order successor (smallest key in the right subtree), or in-order predecessor.', null, '00000000-0000-0000-0000-00000000a003', now() - interval '16 days'), -- q3 / u-chioma
  ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-00000000c001', 'Heaps', 'What is the time complexity of building a heap from n elements?', 'O(n)', 'Most nodes are near the bottom and sift down only a short distance; the sum converges to O(n).', '00000000-0000-0000-0000-00000000a001', now() - interval '15 days'), -- q4 / u-ada
  ('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-00000000c001', 'Heaps', 'In a min-heap stored as an array, where are the children of index i?', '2i + 1 and 2i + 2 (0-indexed).', null, '00000000-0000-0000-0000-00000000a005', now() - interval '14 days'), -- q5 / u-ife
  ('00000000-0000-0000-0000-000000001006', '00000000-0000-0000-0000-00000000c001', 'Graphs', 'Which data structure does BFS use?', 'A queue (FIFO).', null, '00000000-0000-0000-0000-00000000a003', now() - interval '13 days'), -- q6 / u-chioma
  ('00000000-0000-0000-0000-000000001007', '00000000-0000-0000-0000-00000000c001', 'Graphs', 'Adjacency list or matrix for a sparse graph?', 'Adjacency list: O(V + E) space instead of O(V²).', null, '00000000-0000-0000-0000-00000000a004', now() - interval '12 days'), -- q7 / u-kemi
  ('00000000-0000-0000-0000-000000001008', '00000000-0000-0000-0000-00000000c001', 'Graphs', 'What does DFS use to detect a cycle in a directed graph?', 'A back edge: reaching a vertex that is still on the recursion stack (grey).', null, '00000000-0000-0000-0000-00000000a001', now() - interval '11 days'), -- q8 / u-ada
  ('00000000-0000-0000-0000-000000001009', '00000000-0000-0000-0000-00000000c001', 'Hashing', 'What is the load factor of a hash table?', 'n / m: the number of stored keys divided by the number of buckets.', null, '00000000-0000-0000-0000-00000000a002', now() - interval '10 days'), -- q9 / u-tunde
  ('00000000-0000-0000-0000-000000001010', '00000000-0000-0000-0000-00000000c001', 'Hashing', 'Name two ways to resolve collisions.', 'Separate chaining and open addressing (linear probing, quadratic probing, double hashing).', null, '00000000-0000-0000-0000-00000000a004', now() - interval '8 days'), -- q10 / u-kemi
  ('00000000-0000-0000-0000-000000001011', '00000000-0000-0000-0000-00000000c001', 'Trees', 'What property must an AVL tree maintain?', 'For every node, the heights of the left and right subtrees differ by at most 1.', null, '00000000-0000-0000-0000-00000000a003', now() - interval '5 days'), -- q11 / u-chioma
  ('00000000-0000-0000-0000-000000001012', '00000000-0000-0000-0000-00000000c001', 'Graphs', 'Why can''t Dijkstra handle negative edge weights?', 'It finalises a vertex once popped; a later negative edge could have produced a shorter path.', null, '00000000-0000-0000-0000-00000000a005', now() - interval '2 days'); -- q12 / u-ife

insert into quiz_attempts (id, user_id, question_id, correct, attempted_at) values
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000001001', true,  now() - interval '3 days'), -- a1 / q1
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000001002', true,  now() - interval '3 days'), -- a2 / q2
  ('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000001003', false, now() - interval '3 days'), -- a3 / q3
  ('00000000-0000-0000-0000-000000002004', '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000001006', true,  now() - interval '2 days'), -- a4 / q6
  ('00000000-0000-0000-0000-000000002005', '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000001012', false, now() - interval '2 days'), -- a5 / q12
  ('00000000-0000-0000-0000-000000002006', '00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-000000001009', true,  now() - interval '1 days'); -- a6 / q9

insert into retros (session_id, user_id, rating, helped, "change", balanced) values
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a002', 5, 'Answering alone first showed me what I didn''t know.', 'Start on time.', 'yes'), -- s-past-1 / u-tunde
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a003', 4, 'The questioner role kept us honest.', 'Fewer questions, more depth.', 'somewhat'), -- s-past-1 / u-chioma
  ('00000000-0000-0000-0000-00000000e001', '00000000-0000-0000-0000-00000000a001', 4, 'Comparing answers.', 'Share questions before the session.', 'yes'), -- s-past-1 / u-ada
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a002', 5, 'Teaching heapify made it click.', 'Keep turns to 10 minutes.', 'yes'), -- s-past-2 / u-tunde
  ('00000000-0000-0000-0000-00000000e002', '00000000-0000-0000-0000-00000000a005', 4, 'Hearing it explained four ways.', 'A shared diagram board.', 'yes'); -- s-past-2 / u-ife

insert into messages (id, group_id, user_id, body, created_at) values
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a002', 'Added 3 traversal questions to the bank from last session', now() - interval '26 hours'), -- m1 / u-tunde
  ('00000000-0000-0000-0000-000000003002', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a004', 'Found a really good AVL rotation visual: https://visualgo.net/en/bst', now() - interval '25 hours'), -- m2 / u-kemi
  ('00000000-0000-0000-0000-000000003003', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a001', 'Nice, thanks both. Next session is a Retrieval Round on graphs. Bring 2 questions from Chapter 4.', now() - interval '20 hours'), -- m3 / u-ada
  ('00000000-0000-0000-0000-000000003004', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a003', 'Can we do BFS vs DFS first? I keep mixing up when to use which', now() - interval '3 hours'), -- m4 / u-chioma
  ('00000000-0000-0000-0000-000000003005', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a005', '+1, and topological sort if there''s time', now() - interval '2 hours'), -- m5 / u-ife
  ('00000000-0000-0000-0000-000000003006', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000a001', 'Good call. I''ll put it first in the agenda.', now() - interval '45 minutes'); -- m6 / u-ada

commit;
