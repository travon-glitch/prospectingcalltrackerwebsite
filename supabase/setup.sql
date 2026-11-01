-- ============================================================================================================
-- Prospecting Call Tracker website: Supabase setup
-- Paste this whole file into Supabase → SQL Editor → New query → Run. It is safe to run again.
--
-- BEFORE RUNNING: change the email address on the last line to YOUR login email.
-- ============================================================================================================

-- People allowed to use the website editor (/admin). Add a row here for each person, then invite them in
-- Supabase → Authentication → Users → Invite user (same email).
create table if not exists public.website_admins (
  email      text primary key check (email = lower(email)),
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  added_at   timestamptz not null default now()
);

-- The website content (one row). It's the same text visitors see on the public website.
create table if not exists public.site_content (
  id          int primary key default 1 check (id = 1),
  content     jsonb not null,
  version     bigint not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

-- Every published version, for "History & undo".
create table if not exists public.site_content_history (
  id          bigserial primary key,
  content     jsonb not null,
  message     text,
  created_at  timestamptz not null default now(),
  created_by  text
);
create index if not exists site_content_history_created_at on public.site_content_history (created_at desc);

-- Is the logged-in person on the editor list?
create or replace function public.is_website_admin() returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.website_admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_website_admin() from public;
grant execute on function public.is_website_admin() to anon, authenticated;

-- ------------------------------------------------------------------------------------------------ security rules
alter table public.website_admins       enable row level security;
alter table public.site_content         enable row level security;
alter table public.site_content_history enable row level security;

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
grant select, insert on public.site_content_history to authenticated;
grant usage on sequence public.site_content_history_id_seq to authenticated;
grant select on public.website_admins to authenticated;

-- Anyone may READ the published content (it's what's on the public website; the website build reads it).
drop policy if exists "Website content is public" on public.site_content;
create policy "Website content is public" on public.site_content for select using (true);

-- Only people on the editor list may change it.
drop policy if exists "Editors can add content" on public.site_content;
create policy "Editors can add content" on public.site_content for insert to authenticated with check (public.is_website_admin());
drop policy if exists "Editors can change content" on public.site_content;
create policy "Editors can change content" on public.site_content for update to authenticated
  using (public.is_website_admin()) with check (public.is_website_admin());

-- History: editors only.
drop policy if exists "Editors can see history" on public.site_content_history;
create policy "Editors can see history" on public.site_content_history for select to authenticated using (public.is_website_admin());
drop policy if exists "Editors can add history" on public.site_content_history;
create policy "Editors can add history" on public.site_content_history for insert to authenticated with check (public.is_website_admin());

-- Editors can see who else is on the list (nobody can change it from the website; do that here in Supabase).
drop policy if exists "Editors can see the editor list" on public.website_admins;
create policy "Editors can see the editor list" on public.website_admins for select to authenticated using (public.is_website_admin());

-- ------------------------------------------------------------------------------------------------ photos & files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('website-media', 'website-media', true, 5242880, array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'text/csv', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'video/mp4'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Website media is public" on storage.objects;
create policy "Website media is public" on storage.objects for select using (bucket_id = 'website-media');
drop policy if exists "Editors can upload website media" on storage.objects;
create policy "Editors can upload website media" on storage.objects for insert to authenticated
  with check (bucket_id = 'website-media' and public.is_website_admin());
drop policy if exists "Editors can replace website media" on storage.objects;
create policy "Editors can replace website media" on storage.objects for update to authenticated
  using (bucket_id = 'website-media' and public.is_website_admin());
drop policy if exists "Editors can delete website media" on storage.objects;
create policy "Editors can delete website media" on storage.objects for delete to authenticated
  using (bucket_id = 'website-media' and public.is_website_admin());

-- ------------------------------------------------------------------------------------------------ your login
-- ▼▼▼ CHANGE THIS to the email address you will log in with ▼▼▼
insert into public.website_admins (email, role) values (lower('you@example.com'), 'owner') on conflict (email) do nothing;
