-- CamperPlan commerce schema additions

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  project_id uuid,
  stripe_session_id text,
  status text default 'pending',
  currency text default 'gbp',
  amount_total numeric(10,2) default 0,
  line_items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
create unique index if not exists orders_stripe_session_id_key on public.orders(stripe_session_id);

create table if not exists public.user_entitlements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  entitlement_type text not null,
  unlocked_at timestamptz default now()
);
create unique index if not exists user_entitlements_user_type_key
  on public.user_entitlements(user_id, entitlement_type);

create table if not exists public.referrals (
  id uuid default gen_random_uuid() primary key,
  referrer_user_id uuid references auth.users(id) not null,
  referred_user_id uuid references auth.users(id),
  code text not null,
  status text default 'pending',
  reward_claimed boolean default false,
  created_at timestamptz default now()
);

alter table if exists public.projects
  add column if not exists purchased_items text[] default '{}';

