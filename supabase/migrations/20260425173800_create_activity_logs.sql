create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null check (char_length(trim(action)) > 0),
  entity text not null check (entity in ('client', 'idea', 'production', 'auth')),
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_activity_logs_created_at_desc
  on public.activity_logs (created_at desc);

create index if not exists idx_activity_logs_entity_entity_id
  on public.activity_logs (entity, entity_id);

create index if not exists idx_activity_logs_actor_id
  on public.activity_logs (actor_id);

alter table public.activity_logs enable row level security;

create policy "activity_logs_select_authenticated"
  on public.activity_logs
  for select
  to authenticated
  using (true);

create policy "activity_logs_insert_authenticated_self"
  on public.activity_logs
  for insert
  to authenticated
  with check (actor_id is null or auth.uid() = actor_id);
