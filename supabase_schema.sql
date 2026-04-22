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

-- ============================================================
-- V2: System Prompts & Memory Items
-- ============================================================

drop table if exists public.memory_items cascade;
drop table if exists public.system_prompts cascade;

create table public.system_prompts (
  user_id text references public.users(id) on delete cascade not null primary key,
  prompt text not null,
  kb_01_enabled boolean default true not null,
  kb_02_enabled boolean default true not null,
  kb_03_enabled boolean default true not null,
  kb_04_enabled boolean default true not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.memory_items (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete cascade not null,
  content text not null,
  category text default 'general' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

grant all on table public.system_prompts to anon, authenticated;
grant all on table public.memory_items to anon, authenticated;

alter table public.system_prompts disable row level security;
alter table public.memory_items disable row level security;

-- Add share_token to chats (run separately if chats table already exists)
alter table public.chats add column if not exists share_token text unique;

-- V3: User Personalization
drop table if exists public.user_personalization cascade;
create table public.user_personalization (
  user_id text references public.users(id) on delete cascade not null primary key,
  tone text default 'Professional',
  warm text default 'Default',
  enthusiastic text default 'Default',
  headers_lists text default 'Default',
  emoji text default 'Default',
  custom_instructions text default '',
  nickname text default '',
  occupation text default '',
  location text default '',
  interests text default '',
  communication_style text default 'Direct',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
grant all on table public.user_personalization to anon, authenticated;
alter table public.user_personalization disable row level security;

-- V4: Password column for profile login verification
alter table public.users add column if not exists password text;
