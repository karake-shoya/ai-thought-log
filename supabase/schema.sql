create extension if not exists "uuid-ossp";

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id text not null,
  title text,
  summary text,
  key_points jsonb,
  next_questions jsonb,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table messages enable row level security;

create policy "Profiles are viewable by owner" on profiles
  for select using (auth.uid() = id);

create policy "Profiles are updatable by owner" on profiles
  for update using (auth.uid() = id);

create policy "Profiles are insertable by owner" on profiles
  for insert with check (auth.uid() = id);

create policy "Sessions are viewable by owner" on sessions
  for select using (auth.uid() = user_id);

create policy "Sessions are insertable by owner" on sessions
  for insert with check (auth.uid() = user_id);

create policy "Sessions are updatable by owner" on sessions
  for update using (auth.uid() = user_id);

create policy "Messages are viewable by session owner" on messages
  for select using (
    exists (
      select 1
      from sessions
      where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
  );

create policy "Messages are insertable by session owner" on messages
  for insert with check (
    exists (
      select 1
      from sessions
      where sessions.id = messages.session_id
        and sessions.user_id = auth.uid()
    )
  );
