alter table public.quizzes
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz;

create index if not exists quizzes_schedule_idx
  on public.quizzes (published, starts_at, ends_at);

create or replace function private.start_exam(p_exam_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $function$
declare
  v_attempt uuid;
  v_quiz public.quizzes%rowtype;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'STUDENT'
  ) then
    raise exception 'STUDENT_ONLY' using errcode = '42501';
  end if;

  select * into v_quiz from public.quizzes
  where id = p_exam_id and published = true;

  if not found then raise exception 'EXAM_NOT_AVAILABLE'; end if;
  if v_quiz.starts_at is not null and clock_timestamp() < v_quiz.starts_at then
    raise exception 'EXAM_NOT_STARTED';
  end if;
  if v_quiz.ends_at is not null and clock_timestamp() >= v_quiz.ends_at then
    raise exception 'EXAM_CLOSED';
  end if;

  insert into public.exam_attempts(student_id, exam_id, status, strikes, started_at)
  values (auth.uid(), p_exam_id, 'IN_PROGRESS', 0, clock_timestamp())
  returning id into v_attempt;
  return v_attempt;
end
$function$;