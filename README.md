# Nihongo Palette

Nihongo Palette is a teacher-first web app for Japanese language lessons. It helps a teacher manage lesson writing, furigana, vocabulary, correction history, AI-generated reading articles, and vocabulary review in one workspace.

The current implementation is an MVP / local development build. It uses fixed teacher and student IDs, Supabase for persistence, and OpenAI for selected AI features. Full production authentication and strict row-level access rules are intentionally left for a later phase.

## Project Status

This repository contains the working prototype for the Nihongo Palette MVP.

Implemented:

- Temporary teacher / student role switching
- Teacher and student dashboards
- Writing workspace with editing, reading mode, furigana, vocabulary, questions, teacher replies, and tracked correction view
- Article generation page using OpenAI
- Furigana generation using a server-side morphological parser
- Vocabulary list and vocabulary test flow
- OpenAI-based vocabulary meaning judgement
- Supabase persistence for writings, vocabulary, questions, corrections, articles, and vocabulary test history

Planned / not yet production-ready:

- Real authentication
- Per-teacher / per-student authorization
- Google Sheet / Google Calendar synchronization
- Production RLS policies
- Deployment configuration

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- OpenAI API
- kuromoji for Japanese tokenization / furigana support

> Note: This project uses a newer Next.js version with behavior that may differ from older App Router examples. See `AGENTS.md` before making framework-level changes.

## Pages and Features

### `/`

Temporary login / role selection screen.

- Teacher-style login UI
- Student Google login placeholder
- Test buttons for teacher and student views
- Links to dashboard and writing workspace

### `/dashboard?role=teacher`

Teacher dashboard.

- Teacher-focused overview
- Student / lesson preparation context
- Feature cards for writing, vocabulary, and articles
- Lesson activity chart
- Entry points into the main workspaces

### `/dashboard?role=student`

Student dashboard.

- Student-focused learning overview
- Access to writing, vocabulary, and article learning flows
- Simplified review-oriented copy

### `/workspace?role=teacher`

Teacher writing workspace.

Main areas:

- Left panel: saved writing list and new writing creation
- Center panel: writing editor, reading mode, furigana preview, and tracked correction view
- Right panel: vocabulary memory bank and teacher assistant panel

Important features:

- Save writings to Supabase
- Generate furigana preview
- Toggle edit / reading mode
- Toggle furigana on / off
- Select text and show action overlay
- Add selected vocabulary with automatic reading and meaning
- Ask / record student questions
- Save teacher replies
- Display tracked changes for writing edits
- Show deleted text with red strikethrough
- Show inserted / corrected text with green highlight

### `/workspace?role=student`

Student writing workspace.

Main differences from teacher view:

- Student review panel instead of teacher support panel
- Displays student questions and teacher replies as review notes
- Keeps vocabulary review visible for learner practice
- Shows tracked correction changes without teacher-only controls

### `/articles?role=teacher`

AI article generation workspace.

Main areas:

- Left panel: saved / generated article history
- Center panel: generation prompt, JLPT level, tone selection, article body, and furigana display
- Right panel: article vocabulary list

Important features:

- Generate Japanese reading articles with OpenAI
- Choose JLPT level
- Choose tone: natural, conversational, or business-oriented
- Toggle furigana
- Select article text and show action overlay
- Add selected words to article vocabulary
- Save generated articles to Supabase

### `/articles?role=student`

Student article view.

- Same article reading layout
- Student-oriented display
- Conversation practice questions are hidden from student view
- Furigana support remains available

### `/vocabulary?role=student`

Vocabulary quiz and review workspace.

Main modes:

- AI quiz generation
- Wordbook test preparation
- Wordbook test execution
- Sentence practice
- Test result screen

Important features:

- Select vocabulary sources from writings and generated articles
- Preview vocabulary before test
- Enter meaning in free text
- Use OpenAI to judge answers as correct / close / incorrect
- Create one-sentence examples after checking meaning
- Sync learner example sentences back to vocabulary records
- Save vocabulary test sessions and per-word results to Supabase

## Data Model Overview

The Supabase schema is stored in:

- `supabase/schema.sql`
- `src/lib/supabase/types.ts`

Primary tables:

- `profiles`
- `students`
- `teacher_students`
- `writings`
- `corrections`
- `articles`
- `vocabulary_items`
- `article_vocabulary_items`
- `questions`
- `vocabulary_test_sessions`
- `vocabulary_test_results`

The current MVP uses fixed IDs:

- Teacher: `00000000-0000-4000-8000-000000000001`
- Student: `00000000-0000-4000-8000-000000000101`

See `supabase/README.md` for setup details and RLS notes.

## Environment Variables

Create `.env.local` based on `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=
```

Recommended local model setting for low-cost development:

```env
OPENAI_MODEL=gpt-5.4-nano
```

Do not commit `.env.local` or any real API keys.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
PORT=3001 npm run dev
```

Open:

```text
http://localhost:3001/
```

Useful direct URLs:

```text
http://localhost:3001/dashboard?role=teacher
http://localhost:3001/dashboard?role=student
http://localhost:3001/workspace?role=teacher
http://localhost:3001/workspace?role=student
http://localhost:3001/articles?role=teacher
http://localhost:3001/articles?role=student
http://localhost:3001/vocabulary?role=student
```

## Validation

Run lint:

```bash
npm run lint
```

Run production build:

```bash
npm run build
```

## Supabase Setup

1. Create or open the Supabase project.
2. Add local environment values to `.env.local`.
3. Run the SQL in `supabase/schema.sql`.
4. Confirm the fixed seed teacher and student exist.
5. Keep the app private while using MVP permissive policies.

Important security note:

The current schema includes MVP-friendly access policies for local/private testing. Before real learners use the app, replace these with real Supabase Auth and strict row-level security:

- Teachers should only access assigned students.
- Students should only access their own data.
- Teacher-only support content should not be visible to students unless explicitly shared.

## OpenAI Usage

OpenAI is currently used for:

- Article generation
- Vocabulary meaning explanation
- Vocabulary answer judgement

The app routes OpenAI calls through server-side API routes so the API key is not exposed to the browser.

Relevant files:

- `app/api/ai/generate-article/route.ts`
- `app/api/ai/explain-vocabulary/route.ts`
- `app/api/ai/judge-vocabulary/route.ts`

## Furigana

Furigana is generated with server-side tokenization.

Relevant files:

- `app/api/furigana/route.ts`
- `src/lib/furigana-server.ts`
- `src/lib/furigana-client.ts`
- `src/lib/furigana.ts`

The client keeps a fallback path for predictable UI behavior, but server-side parsing is the preferred path.

## Current Limitations

- Login UI is not real authentication yet.
- Teacher / student switching is controlled by URL query parameters.
- Fixed teacher and student IDs are used throughout the MVP.
- Some features still use local fallback data when Supabase data is unavailable.
- Google Sheet and Google Calendar synchronization is planned but not implemented.
- Supabase RLS is not production-hardened.
- The app is not yet deployed as a public production service.

## Planned Google Sheet Sync

The intended future flow is:

```text
Google Sheet
  -> Apps Script
  -> Supabase Edge Function
  -> Supabase DB
  -> Nihongo Palette
```

Target sources:

- Student log: student name, display name, Gmail, lesson price
- Master log: lesson date/time, student name, Google Calendar event reference

The recommended backend path is an Edge Function with a private sync token. Apps Script should not hold broad database credentials.

## Repository Notes for Engineers

- Keep generated folders out of git: `.next`, `.next-dev`, `node_modules`, `dist`, `out`.
- Keep local secrets out of git: `.env.local`, real Supabase keys, OpenAI keys.
- Prefer existing component patterns and color tokens in `app/globals.css`.
- Do not introduce real authentication without revisiting Supabase RLS.
- When changing Next.js behavior, check the local Next.js docs under `node_modules/next/dist/docs/` because this project uses Next.js 16.

## License

Private project. Add a license before making the repository public.
