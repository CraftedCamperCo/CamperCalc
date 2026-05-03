alter table if exists public.orders
  add column if not exists display_order_id text;

create index if not exists orders_display_order_id_idx
  on public.orders(display_order_id);

create table if not exists public.pending_wiring_specs (
  id uuid default gen_random_uuid() primary key,
  stripe_session_id text not null,
  user_id uuid references auth.users(id),
  project_id uuid,
  wiring_spec jsonb not null default '{}'::jsonb,
  build_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists pending_wiring_specs_session_key
  on public.pending_wiring_specs(stripe_session_id);
