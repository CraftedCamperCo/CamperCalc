-- Ensure authenticated users can update their own projects rows.
-- This supports client-side analytics writes such as summary_viewed_at.
alter table if exists public.projects enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'projects_update_own_rows'
  ) then
    create policy projects_update_own_rows
      on public.projects
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
