create table if not exists workout_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  date        date not null default current_date,
  description text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, date)
);

alter table workout_logs enable row level security;

create policy "workout_logs_select" on workout_logs
  for select using (true);

create policy "workout_logs_insert" on workout_logs
  for insert with check (auth.uid() = user_id);

create policy "workout_logs_update" on workout_logs
  for update using (auth.uid() = user_id);

create policy "workout_logs_delete" on workout_logs
  for delete using (auth.uid() = user_id);
