# Supabase setup

Phase 3 starts with fixed teacher/student IDs and no real login.

## 1. Environment variables

The local app reads:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Local values are stored in `.env.local`, which is ignored by git.

## 2. Create tables and seed data

Open the Supabase project SQL Editor and run:

```sql
-- Copy and run the contents of supabase/schema.sql
```

The schema creates the initial tables and seed data for:

- teacher: `00000000-0000-4000-8000-000000000001`
- student: `00000000-0000-4000-8000-000000000101`

## 3. Implementation order

1. Read `writings` from Supabase.
2. Save writing edits to Supabase.
3. Connect `vocabulary_items`.
4. Connect `questions`.
5. Connect `corrections`.
6. Add Supabase Auth and RLS in a later phase.

## 4. Temporary Auth / RLS rules

The current Supabase connection is for local development and limited testing only.

- The app uses fixed IDs instead of real login.
- The browser uses the public anon key to read and write Phase 3 tables.
- Do not use this setup for a public MVP with real students.
- Before public testing, add Supabase Auth and Row Level Security.

Expected access rules after Auth / RLS:

- Teachers can read and update data for students assigned through `teacher_students`.
- Students can read their own writings, vocabulary, questions, corrections, and shared articles.
- Students should not read other students' data.
- Teachers should not read students they are not assigned to.
- Teacher Support Panel data should remain teacher-only.

Until Auth / RLS is implemented, keep the app in local or private testing and avoid storing sensitive learner data.
