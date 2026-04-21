-- CLEAR PREVIOUS SCHEMA AND FOREIGN KEYS TO AVOID CONFLICTS
drop table if exists public.messages cascade;
drop table if exists public.chats cascade;
drop table if exists public.azure_configs cascade;
drop table if exists public.users cascade;

-- 1. Create fully untethered tables
create table public.users (
  id text primary key,
  name text,
  email text,
  avatar text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.azure_configs (
  user_id text references public.users(id) on delete cascade not null primary key,
  api_key text,
  endpoint text,
  deployment text,
  model text,
  version text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete cascade not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  role text not null,
  content text not null,
  raw_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXPLICIT NETWORK GRANTS (REQUIRED FOR UNAUTHENTICATED REST API ACCESS)
grant all on table public.users to anon, authenticated;
grant all on table public.azure_configs to anon, authenticated;
grant all on table public.chats to anon, authenticated;
grant all on table public.messages to anon, authenticated;

-- BRUTE-FORCE DISABLE ALL ROW LEVEL SECURITY (RLS)
-- This overrides any hidden Supabase platform defaults and explicitly forces open access
alter table public.users disable row level security;
alter table public.azure_configs disable row level security;
alter table public.chats disable row level security;
alter table public.messages disable row level security;

-- RLS IS DISABLED ON THESE TABLES SO NO AUTHORIZATION OR AUTHENTICATION IS REQUIRED TO READ/WRITE.
-- This fulfills the explicit user request to remove every type of auth completely.
