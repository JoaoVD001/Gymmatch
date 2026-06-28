-- Push subscriptions (uma por usuário)
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null unique,
  endpoint   text not null,
  p256dh     text not null,
  auth       text not null,
  updated_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy "push_sub_own" on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Convites de treino
create table if not exists workout_invites (
  id            uuid primary key default gen_random_uuid(),
  from_user     uuid references profiles(id) on delete cascade not null,
  to_user       uuid references profiles(id) on delete cascade not null,
  academy_name  text not null,
  scheduled_at  timestamptz not null,
  status        text default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  notified_1d   boolean default false,
  notified_2h   boolean default false,
  created_at    timestamptz default now()
);
alter table workout_invites enable row level security;
create policy "wi_select" on workout_invites
  for select using (auth.uid() = from_user or auth.uid() = to_user);
create policy "wi_insert" on workout_invites
  for insert with check (auth.uid() = from_user);
create policy "wi_update" on workout_invites
  for update using (auth.uid() = from_user or auth.uid() = to_user);
create policy "wi_delete" on workout_invites
  for delete using (auth.uid() = from_user);
