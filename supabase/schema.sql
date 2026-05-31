-- daily-log — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: uses IF NOT EXISTS / idempotent policy drops.

-- ─── daily_logs ────────────────────────────────────────────────────────────
-- One row per user per calendar day. `data` holds the full DayData JSON blob,
-- mirroring lib/storage.ts (the app stays the source of the shape).
create table if not exists public.daily_logs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ─── user_settings ─────────────────────────────────────────────────────────
-- One row per user. Streak start dates (null = not started).
create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  sugar_start date,
  focus_start date,
  updated_at  timestamptz not null default now()
);

-- ─── Row-Level Security ──────────────────────────────────────────────────────
alter table public.daily_logs    enable row level security;
alter table public.user_settings enable row level security;

-- daily_logs: each user may only touch their own rows.
drop policy if exists "daily_logs_select_own" on public.daily_logs;
create policy "daily_logs_select_own" on public.daily_logs
  for select using (auth.uid() = user_id);

drop policy if exists "daily_logs_insert_own" on public.daily_logs;
create policy "daily_logs_insert_own" on public.daily_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "daily_logs_update_own" on public.daily_logs;
create policy "daily_logs_update_own" on public.daily_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_logs_delete_own" on public.daily_logs;
create policy "daily_logs_delete_own" on public.daily_logs
  for delete using (auth.uid() = user_id);

-- user_settings: each user may only touch their own row.
drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings
  for select using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_delete_own" on public.user_settings;
create policy "user_settings_delete_own" on public.user_settings
  for delete using (auth.uid() = user_id);
