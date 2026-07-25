create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  role text not null check (role in ('teacher', 'student')),
  display_name text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  level text check (level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  interest text,
  next_lesson_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

create table if not exists public.writings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  draft text not null default '',
  furigana_preview text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.corrections (
  id uuid primary key default gen_random_uuid(),
  writing_id uuid not null references public.writings(id) on delete cascade,
  before_text text not null,
  after_text text not null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  level text not null check (level in ('N5', 'N4', 'N3', 'N2', 'N1')),
  topic text not null,
  title text not null,
  body text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  writing_id uuid references public.writings(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  word text not null,
  reading text,
  meaning text,
  example text,
  source_sentence text,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  writing_id uuid not null references public.writings(id) on delete cascade,
  speaker text not null check (speaker in ('student', 'teacher')),
  label text,
  body text not null,
  selected_text text,
  selected_sentence text,
  created_at timestamptz not null default now()
);

create table if not exists public.article_vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  word text not null,
  reading text,
  meaning text,
  example text,
  created_at timestamptz not null default now()
);

create table if not exists public.vocabulary_test_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  source_ids text[] not null default '{}',
  source_titles text[] not null default '{}',
  total_count integer not null default 0,
  correct_count integer not null default 0,
  close_count integer not null default 0,
  incorrect_count integer not null default 0,
  created_by_role text not null default 'student' check (created_by_role in ('teacher', 'student')),
  created_at timestamptz not null default now()
);

create table if not exists public.vocabulary_test_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.vocabulary_test_sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  vocabulary_item_id uuid references public.vocabulary_items(id) on delete set null,
  article_vocabulary_item_id uuid references public.article_vocabulary_items(id) on delete set null,
  source_id text not null,
  source_type text not null check (source_type in ('writing', 'article')),
  word text not null,
  reading text,
  meaning text,
  answer text not null default '',
  judgement text not null check (judgement in ('correct', 'close', 'incorrect')),
  judgement_label text not null,
  judgement_message text,
  learner_sentence text,
  created_at timestamptz not null default now()
);

create index if not exists writings_student_id_idx on public.writings(student_id);
create index if not exists corrections_writing_id_idx on public.corrections(writing_id);
create index if not exists vocabulary_items_student_id_idx on public.vocabulary_items(student_id);
create index if not exists vocabulary_items_writing_id_idx on public.vocabulary_items(writing_id);
create index if not exists questions_writing_id_idx on public.questions(writing_id);
create index if not exists articles_student_id_idx on public.articles(student_id);
create index if not exists vocabulary_test_sessions_student_id_idx on public.vocabulary_test_sessions(student_id);
create index if not exists vocabulary_test_sessions_created_at_idx on public.vocabulary_test_sessions(created_at desc);
create index if not exists vocabulary_test_results_session_id_idx on public.vocabulary_test_results(session_id);
create index if not exists vocabulary_test_results_student_id_idx on public.vocabulary_test_results(student_id);

insert into public.profiles (id, role, display_name, email)
values
  ('00000000-0000-4000-8000-000000000001', 'teacher', '山田先生', null)
on conflict (id) do update set
  role = excluded.role,
  display_name = excluded.display_name,
  email = excluded.email,
  updated_at = now();

insert into public.students (id, profile_id, name, level, interest, next_lesson_focus)
values
  (
    '00000000-0000-4000-8000-000000000101',
    null,
    'Emma Johnson',
    'N4',
    '旅行とカフェ',
    '過去形で週末の出来事を話す'
  )
on conflict (id) do update set
  name = excluded.name,
  level = excluded.level,
  interest = excluded.interest,
  next_lesson_focus = excluded.next_lesson_focus,
  updated_at = now();

insert into public.teacher_students (teacher_id, student_id)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000101'
  )
on conflict (teacher_id, student_id) do nothing;

insert into public.writings (id, student_id, title, draft, furigana_preview)
values
  (
    '00000000-0000-4000-8000-000000001001',
    '00000000-0000-4000-8000-000000000101',
    '週末の旅行',
    '先週の土曜日、友だちと鎌倉へ行きました。海を見て、お寺を見ました。とても楽しかったです。',
    '先週(せんしゅう)の土曜日(どようび)、友(とも)だちと鎌倉(かまくら)へ行(い)きました。'
  )
on conflict (id) do update set
  title = excluded.title,
  draft = excluded.draft,
  furigana_preview = excluded.furigana_preview,
  updated_at = now();

alter table public.vocabulary_test_sessions enable row level security;
alter table public.vocabulary_test_results enable row level security;

grant select, insert, update, delete on public.vocabulary_test_sessions to anon, authenticated;
grant select, insert, update, delete on public.vocabulary_test_results to anon, authenticated;

drop policy if exists "MVP allow vocabulary test sessions select" on public.vocabulary_test_sessions;
drop policy if exists "MVP allow vocabulary test sessions insert" on public.vocabulary_test_sessions;
drop policy if exists "MVP allow vocabulary test sessions update" on public.vocabulary_test_sessions;
drop policy if exists "MVP allow vocabulary test sessions delete" on public.vocabulary_test_sessions;
drop policy if exists "MVP allow vocabulary test results select" on public.vocabulary_test_results;
drop policy if exists "MVP allow vocabulary test results insert" on public.vocabulary_test_results;
drop policy if exists "MVP allow vocabulary test results update" on public.vocabulary_test_results;
drop policy if exists "MVP allow vocabulary test results delete" on public.vocabulary_test_results;

create policy "MVP allow vocabulary test sessions select"
  on public.vocabulary_test_sessions for select
  to anon, authenticated
  using (true);

create policy "MVP allow vocabulary test sessions insert"
  on public.vocabulary_test_sessions for insert
  to anon, authenticated
  with check (true);

create policy "MVP allow vocabulary test sessions update"
  on public.vocabulary_test_sessions for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "MVP allow vocabulary test sessions delete"
  on public.vocabulary_test_sessions for delete
  to anon, authenticated
  using (true);

create policy "MVP allow vocabulary test results select"
  on public.vocabulary_test_results for select
  to anon, authenticated
  using (true);

create policy "MVP allow vocabulary test results insert"
  on public.vocabulary_test_results for insert
  to anon, authenticated
  with check (true);

create policy "MVP allow vocabulary test results update"
  on public.vocabulary_test_results for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "MVP allow vocabulary test results delete"
  on public.vocabulary_test_results for delete
  to anon, authenticated
  using (true);
