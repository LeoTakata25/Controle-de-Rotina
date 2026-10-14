-- Quadro de estudos (Backlog / Sprint / Em andamento / Finalizado) + calendário semanal.
-- Rode no Supabase: SQL Editor > New query > cole e execute. Pode rodar mais de uma vez.
-- Premissa: study_materials.id é do tipo uuid.

-- 1) Etapa de cada material no quadro
alter table public.study_materials
  add column if not exists status text not null default 'backlog',
  add column if not exists estimated_minutes integer not null default 0;

alter table public.study_materials drop constraint if exists study_materials_status_check;
alter table public.study_materials
  add constraint study_materials_status_check check (status in ('backlog','sprint','doing','done'));

-- Materiais que já estavam concluídos vão para "Finalizado"
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'study_materials' and column_name = 'completed') then
    update public.study_materials set status = 'done' where completed is true and status = 'backlog';
  end if;
end $$;

-- 2) Blocos do calendário: "este material, neste dia, por X minutos"
create table if not exists public.study_blocks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  material_id uuid not null references public.study_materials(id) on delete cascade,
  block_date  date not null,
  minutes     integer not null default 60 check (minutes between 5 and 720),
  created_at  timestamptz not null default now()
);

create index if not exists study_blocks_user_date_idx on public.study_blocks (user_id, block_date);
create index if not exists study_blocks_material_idx on public.study_blocks (material_id);

-- 3) RLS: cada usuário só enxerga e altera os próprios blocos
alter table public.study_blocks enable row level security;

drop policy if exists "study_blocks_select_own" on public.study_blocks;
drop policy if exists "study_blocks_insert_own" on public.study_blocks;
drop policy if exists "study_blocks_update_own" on public.study_blocks;
drop policy if exists "study_blocks_delete_own" on public.study_blocks;

create policy "study_blocks_select_own" on public.study_blocks for select using (user_id = auth.uid());
create policy "study_blocks_insert_own" on public.study_blocks for insert with check (user_id = auth.uid());
create policy "study_blocks_update_own" on public.study_blocks for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "study_blocks_delete_own" on public.study_blocks for delete using (user_id = auth.uid());
