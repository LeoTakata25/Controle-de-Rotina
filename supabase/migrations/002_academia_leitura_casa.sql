-- Academia (treinos e sessões), Leitura (livros e registros) e Casa (afazeres).
-- Rode no Supabase: SQL Editor > New query > cole e execute. Pode rodar mais de uma vez.

-- ===== Academia =====
create table if not exists public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  weekdays   jsonb not null default '[]'::jsonb,   -- dias da semana (0 = domingo ... 6 = sábado)
  exercises  jsonb not null default '[]'::jsonb,   -- [{name, sets, reps}]
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id       uuid references public.workouts(id) on delete set null,
  workout_name     text not null default '',
  session_date     date not null,
  status           text not null default 'done' check (status in ('active','done','skipped')),
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  notes            text not null default '',
  log              jsonb not null default '[]'::jsonb,   -- [{name, sets:[{reps, kg, done}]}]
  created_at       timestamptz not null default now()
);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions (user_id, session_date);

-- ===== Leitura =====
create table if not exists public.books (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null,
  author       text not null default '',
  total_pages  integer not null default 0 check (total_pages >= 0),
  current_page integer not null default 0 check (current_page >= 0),
  status       text not null default 'want' check (status in ('want','reading','finished')),
  started_at   date,
  finished_at  date,
  notes        text not null default '',
  created_at   timestamptz not null default now()
);

create table if not exists public.reading_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  book_id    uuid not null references public.books(id) on delete cascade,
  log_date   date not null,
  pages      integer not null default 0 check (pages >= 0),
  minutes    integer not null default 0 check (minutes >= 0),
  created_at timestamptz not null default now()
);
create index if not exists reading_logs_user_date_idx on public.reading_logs (user_id, log_date);
create index if not exists reading_logs_book_idx on public.reading_logs (book_id);

-- ===== Casa =====
create table if not exists public.home_tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title      text not null,
  notes      text not null default '',
  category   text not null default 'Casa',
  due_date   date not null default current_date,
  done       boolean not null default false,
  done_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists home_tasks_user_date_idx on public.home_tasks (user_id, due_date);

-- ===== RLS + permissões (cada usuário só enxerga e altera o que é dele) =====
grant usage on schema public to authenticated;

do $$
declare t text;
begin
  foreach t in array array['workouts','workout_sessions','books','reading_logs','home_tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_own', t);
    execute format('create policy %I on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_own', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

notify pgrst, 'reload schema';
