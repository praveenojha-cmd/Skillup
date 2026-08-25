-- ============================================================================
-- Phase 2D security hardening — learner quiz answer-key protection,
-- server-side quiz submission authorization, and a hardened learner
-- self-update policy on public.employees.
--
-- REVISION 2 — rewritten against VERIFIED live-schema facts supplied by a
-- separate read-only schema audit against the production database (id
-- types, exact column names, exact FK chain, exact existing RLS policy
-- names). This file replaces the prior draft in full; the prior draft's
-- `bigint` id assumptions and `quizzes.course_id` assumption were wrong.
--
-- REVISION 3 — a further read-only review found that Revision 2's
-- learner_submit_quiz_attempt wrote to columns that do not exist:
-- quiz_attempts.max_score/.percentage/.answers, lesson_progress.assignment_id,
-- course_assignments.progress_percentage/.completed_at, and
-- course_completions.assignment_id. All of these were guesses carried over
-- from the pre-existing application code, never independently verified.
-- A second schema audit supplied the exact real column lists for
-- quiz_attempts, lesson_progress, course_assignments, and course_completions
-- (see below); every INSERT/UPDATE in learner_submit_quiz_attempt has been
-- rewritten to reference only those real columns. learner_get_course_quiz_questions
-- and the RLS/policy sections (Steps 1, 4, 5) were not affected by this
-- discovery and are unchanged from Revision 2. See the inline comments in
-- Step 3 for the specific decisions made (what quiz_attempts.score now
-- stores, why p_answers is not persisted, how progress is derived instead
-- of written, and what course_completions.final_score is set to).
--
-- REVISION 4 — a final security audit found a MEDIUM finding: if an
-- already-COMPLETED course_assignment's course later has a lesson/module/
-- quiz added to it, and the employee then submits another quiz attempt for
-- that course, the recomputed totals could make the assignment look
-- incomplete again, silently downgrading its status from COMPLETED back to
-- IN_PROGRESS. learner_submit_quiz_attempt's course_assignments UPDATE now
-- makes status monotonic once COMPLETED — see the inline comment at that
-- UPDATE. This is the only change in this revision; nothing else in the
-- file was touched.
--
-- STATUS: AUTHORED, NOT APPLIED, NOT EXECUTED.
-- This tool still has no live Supabase connection, no service_role key, and
-- no Postgres connection string in this environment, and none was requested
-- or used to write this file. A human with SQL Editor / `supabase db push`
-- access must review and run it. Nothing here has been verified against a
-- live run — only reviewed for logical correctness against the verified
-- facts supplied.
--
-- VERIFIED FACTS THIS FILE IS BUILT ON (do not re-derive/guess elsewhere):
--   - All listed IDs (employees.id, employees.auth_user_id, courses.id,
--     modules.id, lessons.id, quizzes.id, quiz_questions.id,
--     quiz_options.id, course_assignments.id, course_assignments.employee_id,
--     course_assignments.course_id, quiz_attempts.id/.employee_id/.quiz_id,
--     lesson_progress.id/.employee_id/.lesson_id) are `uuid`.
--   - employees.employee_id (the human-readable business code) is `text` —
--     but course_assignments.employee_id / quiz_attempts.employee_id /
--     lesson_progress.employee_id are `uuid`, i.e. they reference
--     employees.id, NOT employees.employee_id. Every function below joins
--     accordingly.
--   - private.is_admin() takes no arguments and returns boolean.
--   - quizzes has NO course_id/module_id/description/time_limit_minutes/
--     is_active columns. Verified quizzes columns: id, lesson_id, title,
--     passing_score (numeric), attempts_allowed (integer, nullable),
--     created_at, updated_at.
--   - quiz_questions has NO points/question_type columns. Verified columns:
--     id, quiz_id, question_text, explanation, sequence, created_at,
--     updated_at.
--   - quiz_options verified columns: id, question_id, option_text,
--     is_correct, sequence, created_at.
--   - The real curriculum chain is:
--       courses -> modules (modules.course_id) -> lessons (lessons.module_id)
--       -> quizzes (quizzes.lesson_id) -> quiz_questions -> quiz_options
--     Quizzes do NOT have a direct course_id; a quiz's course is only
--     reachable by walking lesson -> module -> course.
--   - Existing RLS policies confirmed to exist today:
--       public.employees:      "Admins can manage employees" (ALL),
--                               "Employees can update own basic profile" (UPDATE),
--                               "Employees can view own employee record" (SELECT)
--       public.quiz_attempts:  "Admins can manage quiz attempts" (ALL),
--                               "Employees can create own quiz attempts" (INSERT),
--                               "Employees can view own quiz attempts" (SELECT)
--       public.quiz_options:   "Admins can manage quiz options" (ALL),
--                               "Employees can view quiz options" (SELECT)
--     Their exact USING/WITH CHECK expressions were NOT supplied — only
--     names/commands/roles. Where this migration replaces a policy, it does
--     so under the SAME name (never a blind DROP with nothing restored),
--     specifically because the original expression body could not be
--     inspected.
--
-- VERIFIED WRITE-TARGET SCHEMAS (Revision 3 — confirmed via live schema audit,
-- not application-code inference):
--   quiz_attempts:       id, employee_id, quiz_id, attempt_number, score
--                         (numeric), passed (boolean), started_at,
--                         completed_at, created_at. NO max_score, NO
--                         percentage, NO answers column.
--   lesson_progress:     id, employee_id, lesson_id, status (progress_status),
--                         last_position_seconds, started_at, completed_at,
--                         created_at, updated_at. NO assignment_id column.
--   course_assignments:  id, employee_id, course_id, status
--                         (assignment_status), assigned_at, assigned_by,
--                         deadline, revoked_at, revoked_by, created_at,
--                         updated_at. NO progress_percentage, NO completed_at
--                         column.
--   course_completions:  id, employee_id, course_id, final_score (numeric,
--                         nullable), completed_at, certificate_url,
--                         created_at. NO assignment_id column.
--
-- REMAINING UNVERIFIED ASSUMPTION:
--   - Whether lesson_progress has a unique constraint on (employee_id,
--     lesson_id) — required for the ON CONFLICT upsert in Step 3 to work.
--     This was stated as verified in the schema audit that produced this
--     revision; if it turns out not to exist, change the upsert to a manual
--     select-then-insert/update.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- STEP 0 — DISCOVERY (run first, read-only, changes nothing)
-- ----------------------------------------------------------------------------
--   select policyname, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public' and tablename in ('employees', 'quiz_options', 'quiz_attempts')
--   order by tablename, policyname;
--
--   select conname, contype, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid = 'public.lesson_progress'::regclass;
--
--   \d public.quiz_attempts
--   \d public.course_assignments
--   \d public.lesson_progress
--   \d public.course_completions


-- ----------------------------------------------------------------------------
-- STEP 1 — Remove the learner-facing direct SELECT on quiz_options (Task 1 /
-- Section 5). Admin access via "Admins can manage quiz options" (ALL) is
-- untouched.
-- ----------------------------------------------------------------------------
drop policy if exists "Employees can view quiz options" on public.quiz_options;

-- After this, an authenticated learner session has no policy at all covering
-- public.quiz_options: `supabase.from('quiz_options').select('*')` returns
-- zero rows (not an error, not is_correct — nothing) for a learner. The only
-- way learner code can read question/option data is the RPC in Step 2, which
-- never returns is_correct.


-- ----------------------------------------------------------------------------
-- STEP 2 — Learner-safe question/option RPC (Section 6)
-- ----------------------------------------------------------------------------
create or replace function public.learner_get_course_quiz_questions(p_course_id uuid)
returns table (
  quiz_id uuid,
  question_id uuid,
  question_text text,
  question_sequence integer,
  option_id uuid,
  option_text text,
  option_sequence integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid;
  v_employment_status text;
  v_skillup_access text;
begin
  -- Identity: derive strictly from auth.uid() -> employees.auth_user_id.
  -- No client-supplied identity of any kind is trusted.
  select e.id, e.employment_status, e.skillup_access
    into v_employee_id, v_employment_status, v_skillup_access
  from public.employees e
  where e.auth_user_id = auth.uid();

  if v_employee_id is null then
    raise exception 'Access denied: no employee profile for this session' using errcode = '42501';
  end if;

  if v_employment_status <> 'ACTIVE' or v_skillup_access <> 'ENABLED' then
    raise exception 'Access denied: learning access is not active' using errcode = '42501';
  end if;

  -- Ownership: caller must hold a non-REVOKED assignment for p_course_id.
  -- course_assignments.employee_id is uuid -> employees.id (verified fact).
  if not exists (
    select 1
    from public.course_assignments ca
    where ca.course_id = p_course_id
      and ca.employee_id = v_employee_id
      and ca.status <> 'REVOKED'
  ) then
    raise exception 'Access denied: no active assignment for this course' using errcode = '42501';
  end if;

  -- Real curriculum chain: courses -> modules -> lessons -> quizzes ->
  -- quiz_questions -> quiz_options. is_correct is intentionally excluded
  -- from both the SELECT list and every output column above.
  return query
    select
      q.id                as quiz_id,
      qq.id               as question_id,
      qq.question_text,
      qq.sequence         as question_sequence,
      qo.id               as option_id,
      qo.option_text,
      qo.sequence         as option_sequence
    from public.courses c
    join public.modules m  on m.course_id = c.id
    join public.lessons l  on l.module_id = m.id
    join public.quizzes q  on q.lesson_id = l.id
    join public.quiz_questions qq on qq.quiz_id = q.id
    join public.quiz_options qo   on qo.question_id = qq.id
    where c.id = p_course_id
    order by q.id, qq.sequence nulls last, qq.id, qo.sequence nulls last, qo.id;
end;
$$;

revoke all on function public.learner_get_course_quiz_questions(uuid) from public;
grant execute on function public.learner_get_course_quiz_questions(uuid) to authenticated;


-- ----------------------------------------------------------------------------
-- STEP 3 — Authoritative, fully server-side quiz submission RPC (Section 7)
-- ----------------------------------------------------------------------------
create or replace function public.learner_submit_quiz_attempt(
  p_quiz_id uuid,
  p_course_id uuid,
  p_assignment_id uuid,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_employee_id uuid;
  v_employment_status text;
  v_skillup_access text;
  v_assignment public.course_assignments%rowtype;
  v_lesson_id uuid;
  v_quiz_course_id uuid;
  v_passing_score numeric;
  v_attempts_allowed integer;
  v_existing_attempts integer;
  v_total_points integer := 0;
  v_scored_points integer := 0;
  v_question record;
  v_correct_ids uuid[];
  v_submitted jsonb;
  v_submitted_ids uuid[];
  v_is_correct boolean;
  v_feedback jsonb := '[]'::jsonb;
  v_percentage integer;
  v_passed boolean;
  v_attempt_number integer;
  v_attempt_id uuid;
  v_now timestamptz := now();
  v_total_lessons integer;
  v_total_quizzes integer;
  v_total_items integer;
  v_completed_lessons integer;
  v_passed_quizzes integer;
  v_new_progress integer;
  v_is_course_completed boolean;
begin
  -- 1-2. Identity strictly from auth.uid() -> employees.auth_user_id.
  -- The browser-supplied employee identity is never used for authorization.
  select e.id, e.employment_status, e.skillup_access
    into v_employee_id, v_employment_status, v_skillup_access
  from public.employees e
  where e.auth_user_id = auth.uid();

  if v_employee_id is null then
    raise exception 'Access denied: no employee profile for this session' using errcode = '42501';
  end if;

  -- 3-5. Employee must exist, be ACTIVE, and be SkillUp-enabled.
  if v_employment_status <> 'ACTIVE' or v_skillup_access <> 'ENABLED' then
    raise exception 'Access denied: learning access is not active' using errcode = '42501';
  end if;

  -- 6-8. Assignment must belong to THIS employee, THIS course, and not be revoked.
  select * into v_assignment
  from public.course_assignments
  where id = p_assignment_id
    and employee_id = v_employee_id
    and course_id = p_course_id
    and status <> 'REVOKED';

  if v_assignment.id is null then
    raise exception 'Access denied: no active assignment for this course' using errcode = '42501';
  end if;

  -- 9. Quiz must belong to the assigned course via quizzes.lesson_id ->
  -- lessons.module_id -> modules.course_id (quizzes has no course_id).
  select l.id, m.course_id
    into v_lesson_id, v_quiz_course_id
  from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.modules m on m.id = l.module_id
  where q.id = p_quiz_id;

  if v_lesson_id is null or v_quiz_course_id is null then
    raise exception 'Quiz not found or curriculum link is broken' using errcode = 'P0002';
  end if;

  if v_quiz_course_id <> p_course_id then
    raise exception 'Access denied: quiz does not belong to the assigned course' using errcode = '42501';
  end if;

  select passing_score, attempts_allowed
    into v_passing_score, v_attempts_allowed
  from public.quizzes
  where id = p_quiz_id;
  v_passing_score := coalesce(v_passing_score, 70);

  -- 13. Respect attempts_allowed when the quiz defines a limit.
  if v_attempts_allowed is not null then
    select count(*) into v_existing_attempts
    from public.quiz_attempts
    where quiz_id = p_quiz_id and employee_id = v_employee_id;

    if v_existing_attempts >= v_attempts_allowed then
      raise exception 'Attempt limit reached: % of % attempts already used for this quiz',
        v_existing_attempts, v_attempts_allowed using errcode = '42501';
    end if;
  end if;

  -- 10-11. Score authoritatively. is_correct is read ONLY in this
  -- SECURITY DEFINER function and is never placed into v_feedback or the
  -- final jsonb result. quiz_questions has no points column (verified), so
  -- every question is weighted equally at 1 point.
  for v_question in
    select id, question_text, explanation
    from public.quiz_questions
    where quiz_id = p_quiz_id
    order by sequence nulls last, id
  loop
    v_total_points := v_total_points + 1;

    select array_agg(id) into v_correct_ids
    from public.quiz_options
    where question_id = v_question.id and is_correct = true;

    v_submitted := p_answers -> v_question.id::text;

    if v_submitted is null then
      v_submitted_ids := array[]::uuid[];
    elsif jsonb_typeof(v_submitted) = 'array' then
      select array_agg((elem)::uuid) into v_submitted_ids
      from jsonb_array_elements_text(v_submitted) as elem;
    else
      v_submitted_ids := array[ (v_submitted #>> '{}')::uuid ];
    end if;

    v_is_correct := (
      coalesce(v_correct_ids, array[]::uuid[]) <@ coalesce(v_submitted_ids, array[]::uuid[])
      and coalesce(v_submitted_ids, array[]::uuid[]) <@ coalesce(v_correct_ids, array[]::uuid[])
    );

    if v_is_correct then
      v_scored_points := v_scored_points + 1;
    end if;

    -- Feedback intentionally carries ONLY whether the learner's own
    -- submission was correct — never the correct option id/text.
    v_feedback := v_feedback || jsonb_build_object(
      'questionId', v_question.id,
      'questionText', v_question.question_text,
      'isCorrect', v_is_correct,
      'pointsAwarded', case when v_is_correct then 1 else 0 end,
      'explanation', v_question.explanation
    );
  end loop;

  v_total_points := greatest(1, v_total_points);
  v_percentage := round((v_scored_points::numeric / v_total_points::numeric) * 100);
  v_passed := v_percentage >= v_passing_score;

  select coalesce(count(*), 0) + 1 into v_attempt_number
  from public.quiz_attempts
  where quiz_id = p_quiz_id and employee_id = v_employee_id;

  -- 14. Store the attempt using ONLY real quiz_attempts columns
  -- (id, employee_id, quiz_id, attempt_number, score, passed, started_at,
  -- completed_at, created_at). There is no max_score, percentage, or
  -- answers column on this table.
  --
  -- DECISION: score stores the computed PERCENTAGE (0-100), not a raw
  -- point count — there is no max_score column to pair a raw count with,
  -- and quizzes.passing_score is itself percentage-shaped, so storing the
  -- percentage in `score` keeps this row directly comparable to
  -- passing_score. `passed` is stored separately as its own boolean, so no
  -- information is lost. This does NOT change the RPC's returned jsonb
  -- below, which still reports score/maxScore/percentage separately for
  -- the existing frontend contract (src/types/database.ts
  -- QuizSubmissionResult) — only the persisted DB row uses this convention.
  --
  -- p_answers is intentionally NOT persisted anywhere: quiz_attempts has no
  -- answers column, and per instruction no column is added to hold it. It
  -- is used only in-memory, above, for scoring.
  --
  -- started_at is set to the same instant as completed_at because this
  -- function only ever runs at submission time; the application does not
  -- track a separate "quiz started" event.
  insert into public.quiz_attempts
    (quiz_id, employee_id, attempt_number, score, passed, started_at, completed_at, created_at)
  values
    (p_quiz_id, v_employee_id, v_attempt_number, v_percentage, v_passed, v_now, v_now, v_now)
  returning id into v_attempt_id;

  -- 15-16. Progress update using the quiz's REAL lesson uuid (v_lesson_id,
  -- derived above from quizzes.lesson_id) and ONLY real lesson_progress
  -- columns (employee_id, lesson_id, status, started_at, completed_at,
  -- created_at, updated_at). There is no assignment_id column on this
  -- table, and no fabricated lesson id is ever used.
  if v_passed then
    insert into public.lesson_progress (employee_id, lesson_id, status, started_at, completed_at, created_at, updated_at)
    values (v_employee_id, v_lesson_id, 'COMPLETED', v_now, v_now, v_now, v_now)
    on conflict (employee_id, lesson_id) do update
      set status = 'COMPLETED', completed_at = v_now, updated_at = v_now;
  end if;

  select count(*) into v_total_lessons
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course_id;

  select count(*) into v_total_quizzes
  from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.modules m on m.id = l.module_id
  where m.course_id = p_course_id;

  v_total_items := greatest(1, v_total_lessons + v_total_quizzes);

  select count(distinct lp.lesson_id) into v_completed_lessons
  from public.lesson_progress lp
  where lp.employee_id = v_employee_id
    and lp.status = 'COMPLETED'
    and lp.lesson_id in (
      select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = p_course_id
    );

  select count(distinct qa.quiz_id) into v_passed_quizzes
  from public.quiz_attempts qa
  where qa.employee_id = v_employee_id
    and qa.passed = true
    and qa.quiz_id in (
      select q.id from public.quizzes q
      join public.lessons l on l.id = q.lesson_id
      join public.modules m on m.id = l.module_id
      where m.course_id = p_course_id
    );

  -- Progress is derived fresh on every call and only ever returned to the
  -- caller (courseProgressUpdated, below) — course_assignments has no
  -- progress_percentage column, so it is never persisted.
  v_new_progress := least(100, round(((coalesce(v_completed_lessons, 0) + coalesce(v_passed_quizzes, 0))::numeric / v_total_items::numeric) * 100));
  v_is_course_completed := (coalesce(v_completed_lessons, 0) >= v_total_lessons and coalesce(v_passed_quizzes, 0) >= v_total_quizzes);

  -- 5/7. Update course_assignments using ONLY real columns (status,
  -- updated_at). progress_percentage and completed_at do not exist on this
  -- table and are therefore never written here.
  --
  -- REVISION 4: status is monotonic once COMPLETED. v_assignment was read at
  -- the top of this function, before any write, so v_assignment.status is
  -- the assignment's true prior state for this call. Without this guard, an
  -- admin adding a lesson/module/quiz to an already-completed course would
  -- cause v_total_lessons/v_total_quizzes to grow on the next submission,
  -- making v_is_course_completed evaluate false again and silently
  -- downgrading a COMPLETED assignment back to IN_PROGRESS. COMPLETED must
  -- never regress, regardless of later curriculum changes.
  update public.course_assignments
  set status = case
      when v_assignment.status = 'COMPLETED' then 'COMPLETED'
      when v_is_course_completed then 'COMPLETED'
      else 'IN_PROGRESS'
    end,
      updated_at = v_now
  where id = v_assignment.id;

  -- 6. Course completion record using ONLY real course_completions columns
  -- (employee_id, course_id, final_score, completed_at, created_at) — no
  -- assignment_id column exists on this table. final_score is set to the
  -- percentage of the quiz attempt that triggered completion, since the
  -- application has no separate "final exam" score to source it from.
  if v_is_course_completed then
    insert into public.course_completions (employee_id, course_id, final_score, completed_at, created_at)
    select v_employee_id, p_course_id, v_percentage, v_now, v_now
    where not exists (
      select 1 from public.course_completions where course_id = p_course_id and employee_id = v_employee_id
    );
  end if;

  -- 17-18. Never return is_correct, correct option id, or correct option
  -- text — only whether the learner's own answer was correct.
  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'score', v_scored_points,
    'maxScore', v_total_points,
    'percentage', v_percentage,
    'passed', v_passed,
    'passingScore', v_passing_score,
    'attemptNumber', v_attempt_number,
    'courseProgressUpdated', v_new_progress,
    'isCourseCompleted', v_is_course_completed,
    'feedback', v_feedback
  );
end;
$$;

revoke all on function public.learner_submit_quiz_attempt(uuid, uuid, uuid, jsonb) from public;
grant execute on function public.learner_submit_quiz_attempt(uuid, uuid, uuid, jsonb) to authenticated;


-- ----------------------------------------------------------------------------
-- STEP 4 — Harden (not blindly delete) the learner self-update policy on
-- public.employees (Section 9).
-- ----------------------------------------------------------------------------
-- The actual USING/WITH CHECK body of "Employees can update own basic
-- profile" was not supplied by the schema audit, so it cannot be inspected
-- here — only its name, command (UPDATE), and role (authenticated) are
-- known. Per instruction, it is NOT blindly dropped with nothing restored:
-- it is replaced, under the SAME name, with a version whose WITH CHECK
-- pins every protected field to its own already-stored value, so no update
-- statement can change them, regardless of what the client sends. Fields
-- NOT pinned below (e.g. full_name, mobile_number) remain editable — the
-- frontend currently has no UI that edits any employee field at all
-- (src/pages/learner/LearnerProfilePage.tsx is read-only display), so this
-- is a safe default rather than a guess about what "genuinely safe fields"
-- should be; adjust the pinned/unpinned column list if your business rules
-- differ.
drop policy if exists "Employees can update own basic profile" on public.employees;

create policy "Employees can update own basic profile"
  on public.employees
  for update
  to authenticated
  using ( auth_user_id = auth.uid() )
  with check (
    auth_user_id = auth.uid()
    and id = (select e2.id from public.employees e2 where e2.auth_user_id = auth.uid())
    and employee_id = (select e2.employee_id from public.employees e2 where e2.auth_user_id = auth.uid())
    and lower(email) = lower((select e2.email from public.employees e2 where e2.auth_user_id = auth.uid()))
    and employment_status = (select e2.employment_status from public.employees e2 where e2.auth_user_id = auth.uid())
    and skillup_access = (select e2.skillup_access from public.employees e2 where e2.auth_user_id = auth.uid())
    and role_id is not distinct from (select e2.role_id from public.employees e2 where e2.auth_user_id = auth.uid())
    and location_id is not distinct from (select e2.location_id from public.employees e2 where e2.auth_user_id = auth.uid())
    and reporting_manager_employee_id is not distinct from (select e2.reporting_manager_employee_id from public.employees e2 where e2.auth_user_id = auth.uid())
    and reporting_manager_name is not distinct from (select e2.reporting_manager_name from public.employees e2 where e2.auth_user_id = auth.uid())
  );

-- "Admins can manage employees" (ALL) and "Employees can view own employee
-- record" (SELECT) are NOT touched by this migration.


-- ----------------------------------------------------------------------------
-- STEP 5 — Harden (not blindly delete) the two learner quiz_attempts
-- policies so ownership is unambiguously tied to auth.uid() (Section 10).
-- ----------------------------------------------------------------------------
-- These policies matter independently of the new RPC: the RPC's own insert
-- always uses the internally-resolved employee_id, but a learner session
-- could still attempt a *direct* `supabase.from('quiz_attempts').insert(...)`
-- call outside the RPC. This WITH CHECK makes that impossible to spoof.
drop policy if exists "Employees can create own quiz attempts" on public.quiz_attempts;

create policy "Employees can create own quiz attempts"
  on public.quiz_attempts
  for insert
  to authenticated
  with check (
    employee_id = (
      select e.id from public.employees e
      where e.auth_user_id = auth.uid()
        and e.employment_status = 'ACTIVE'
        and e.skillup_access = 'ENABLED'
    )
  );

drop policy if exists "Employees can view own quiz attempts" on public.quiz_attempts;

create policy "Employees can view own quiz attempts"
  on public.quiz_attempts
  for select
  to authenticated
  using (
    employee_id = (select e.id from public.employees e where e.auth_user_id = auth.uid())
  );

-- "Admins can manage quiz attempts" (ALL) is NOT touched by this migration.


-- ----------------------------------------------------------------------------
-- STEP 6 — Post-apply verification queries (run manually, read-only)
-- ----------------------------------------------------------------------------
--   select * from public.quiz_options limit 1;
--   -- expect: zero rows for a learner session; full rows incl. is_correct
--   -- for an admin session.
--
--   select * from public.learner_get_course_quiz_questions('<a course_id the
--     test learner is actively assigned to>'::uuid);
--   -- expect: rows with option_id/option_text/*_sequence, no is_correct
--   -- column anywhere in the result.
--
--   select public.learner_submit_quiz_attempt('<quiz_id>'::uuid,
--     '<course_id>'::uuid, '<assignment_id>'::uuid, '{}'::jsonb);
--   -- expect: a scored jsonb result at 0% (no answers submitted); an
--   -- exception if quiz/course/assignment don't genuinely belong together,
--   -- or if the calling session's employee is INACTIVE/DISABLED, or if
--   -- attempts_allowed has been exhausted.
--
--   update public.employees set employment_status = 'INACTIVE' where auth_user_id = auth.uid();
--   -- expect: 0 rows updated / permission denied for a learner session.
--
--   insert into public.quiz_attempts (quiz_id, employee_id, attempt_number, score, passed, started_at, completed_at, created_at)
--   values ('<some quiz_id>'::uuid, '<SOMEONE ELSE''s employee id>'::uuid, 1, 100, true, now(), now(), now());
--   -- expect: permission denied (WITH CHECK failure) for a learner session
--   -- attempting to insert an attempt under another employee's id.
--
-- Do NOT run any of the above in a way that mutates real production rows —
-- use a disposable test course/quiz/assignment, not this migration's job to
-- create or clean up such data.
