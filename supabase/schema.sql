-- =====================================================================
-- Ceylon School of Artificial Intelligence (CSAI): database schema
-- Run this whole file once in Supabase → SQL Editor → New query → Run.
-- It is idempotent-ish for a fresh project; re-running on an existing
-- project may error on "already exists" which is safe to ignore.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Enums ----------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.enrollment_status as enum
    ('pending_payment', 'pending_verification', 'active', 'rejected', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('bank_transfer', 'payhere', 'manual');
exception when duplicate_object then null; end $$;

-- ---------- Tables ---------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  phone       text,
  city        text,
  avatar_url  text,
  role        public.user_role not null default 'student',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.courses (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  tagline           text,
  description       text,
  price_lkr         integer not null default 0 check (price_lkr >= 0),
  duration          text,
  level             text,
  icon              text,              -- lucide icon key used by the frontend
  highlights        text[] not null default '{}',
  outline           jsonb not null default '[]'::jsonb,  -- [{ "title": "", "topics": [""] }]
  is_published      boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete restrict,
  status        public.enrollment_status not null default 'pending_payment',
  activated_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  enrollment_id  uuid not null references public.enrollments (id) on delete cascade,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  course_id      uuid not null references public.courses (id) on delete restrict,
  amount_lkr     integer not null default 0,
  method         public.payment_method not null default 'bank_transfer',
  reference      text,
  paid_on        date,
  slip_path      text,
  status         public.payment_status not null default 'pending',
  admin_note     text,
  reviewed_by    uuid references public.profiles (id) on delete set null,
  reviewed_at    timestamptz,
  gateway_ref    text,               -- reserved for PayHere order/payment id
  created_at     timestamptz not null default now()
);

-- Only one pending payment per enrollment at a time
create unique index if not exists payments_one_pending_per_enrollment
  on public.payments (enrollment_id) where status = 'pending';

create table if not exists public.sessions (
  id                uuid primary key default gen_random_uuid(),
  course_id         uuid not null references public.courses (id) on delete cascade,
  title             text not null,
  description       text,
  starts_at         timestamptz not null,
  duration_minutes  integer not null default 90 check (duration_minutes > 0),
  zoom_url          text,
  zoom_meeting_id   text,
  zoom_passcode     text,
  recording_url     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists sessions_course_starts_idx on public.sessions (course_id, starts_at);
create index if not exists enrollments_user_idx on public.enrollments (user_id);
create index if not exists payments_status_idx on public.payments (status, created_at desc);

-- ---------- Helper functions ----------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
drop trigger if exists enrollments_updated_at on public.enrollments;
create trigger enrollments_updated_at before update on public.enrollments
  for each row execute function public.set_updated_at();
drop trigger if exists sessions_updated_at on public.sessions;
create trigger sessions_updated_at before update on public.sessions
  for each row execute function public.set_updated_at();

-- Create a profile row automatically for every new auth user (email or Google)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Students may edit their own profile but never their role / email
create or replace function public.protect_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role  := old.role;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile();

-- Payments submitted by students: force safe values from the server side
create or replace function public.prepare_payment()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  e record;
begin
  select en.id, en.user_id, en.course_id, c.price_lkr
    into e
    from public.enrollments en
    join public.courses c on c.id = en.course_id
   where en.id = new.enrollment_id;

  if e.id is null then
    raise exception 'Enrollment not found';
  end if;

  new.user_id    := e.user_id;
  new.course_id  := e.course_id;

  if not public.is_admin() then
    new.amount_lkr  := e.price_lkr;
    new.status      := 'pending';
    new.method      := 'bank_transfer';
    new.admin_note  := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end $$;

drop trigger if exists payments_prepare on public.payments;
create trigger payments_prepare before insert on public.payments
  for each row execute function public.prepare_payment();

create or replace function public.after_payment_insert()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'pending' then
    update public.enrollments
       set status = 'pending_verification'
     where id = new.enrollment_id
       and status in ('pending_payment', 'rejected');
  end if;
  return new;
end $$;

drop trigger if exists payments_after_insert on public.payments;
create trigger payments_after_insert after insert on public.payments
  for each row execute function public.after_payment_insert();

-- Admin action: approve / reject a bank transfer in one atomic step
create or replace function public.review_payment(p_payment_id uuid, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public
as $$
declare
  p record;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select * into p from public.payments where id = p_payment_id for update;
  if p.id is null then
    raise exception 'Payment not found';
  end if;

  update public.payments
     set status      = case when p_approve then 'approved'::public.payment_status else 'rejected'::public.payment_status end,
         admin_note  = p_note,
         reviewed_by = auth.uid(),
         reviewed_at = now()
   where id = p_payment_id;

  if p_approve then
    update public.enrollments
       set status = 'active', activated_at = coalesce(activated_at, now())
     where id = p.enrollment_id;
  else
    update public.enrollments
       set status = 'rejected'
     where id = p.enrollment_id and status <> 'active';
  end if;
end $$;

-- ---------- Row Level Security --------------------------------------
alter table public.profiles    enable row level security;
alter table public.courses     enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments    enable row level security;
alter table public.sessions    enable row level security;

-- profiles
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- courses
drop policy if exists "courses: public read published" on public.courses;
create policy "courses: public read published" on public.courses
  for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "courses: admin write" on public.courses;
create policy "courses: admin write" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- enrollments
drop policy if exists "enrollments: read own or admin" on public.enrollments;
create policy "enrollments: read own or admin" on public.enrollments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "enrollments: student creates own" on public.enrollments;
create policy "enrollments: student creates own" on public.enrollments
  for insert to authenticated with check (
    user_id = auth.uid()
    and status = 'pending_payment'
    and exists (select 1 from public.courses c where c.id = course_id and c.is_published)
  );
drop policy if exists "enrollments: student cancels unpaid" on public.enrollments;
create policy "enrollments: student cancels unpaid" on public.enrollments
  for delete to authenticated using (user_id = auth.uid() and status = 'pending_payment');
drop policy if exists "enrollments: admin all" on public.enrollments;
create policy "enrollments: admin all" on public.enrollments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- payments
drop policy if exists "payments: read own or admin" on public.payments;
create policy "payments: read own or admin" on public.payments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "payments: student submits" on public.payments;
create policy "payments: student submits" on public.payments
  for insert to authenticated with check (
    exists (
      select 1 from public.enrollments en
       where en.id = enrollment_id
         and en.user_id = auth.uid()
         and en.status in ('pending_payment', 'rejected')
    )
  );
drop policy if exists "payments: admin all" on public.payments;
create policy "payments: admin all" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- sessions (Zoom links only visible to actively enrolled students)
drop policy if exists "sessions: enrolled or admin read" on public.sessions;
create policy "sessions: enrolled or admin read" on public.sessions
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments en
       where en.course_id = sessions.course_id
         and en.user_id = auth.uid()
         and en.status = 'active'
    )
  );
drop policy if exists "sessions: admin write" on public.sessions;
create policy "sessions: admin write" on public.sessions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Grants (explicit, in case default Data API grants are off) ----
grant usage on schema public to anon, authenticated;
grant select on public.courses to anon;
grant select, insert, update, delete on public.profiles, public.courses, public.enrollments,
  public.payments, public.sessions to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.review_payment(uuid, boolean, text) to authenticated;

-- ---------- Storage: private bucket for bank slips ------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-slips', 'payment-slips', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "slips: upload own folder" on storage.objects;
create policy "slips: upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-slips' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "slips: read own or admin" on storage.objects;
create policy "slips: read own or admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-slips'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------- Seed: draft module outline -------------------------------
insert into public.courses (slug, title, tagline, description, price_lkr, duration, level, icon, highlights, outline, sort_order)
values
(
  'professional-skills-with-ai',
  'Professional Skills with AI',
  'Work smarter: write, research, analyse and present with AI.',
  'Become the most productive person in your team. Learn to use modern AI assistants for writing, research, data analysis, presentations and everyday workflows, responsibly and effectively.',
  25000, '8 weeks · live on Zoom', 'Beginner', 'briefcase',
  array['Prompt engineering that actually works', 'AI for documents, email & reports', 'Data analysis with AI', 'Automating repetitive tasks'],
  '[{"title":"Foundations","topics":["How modern AI models work","Prompting fundamentals","Choosing the right AI tool"]},
    {"title":"Everyday productivity","topics":["Writing & editing with AI","Research and summarising","Meetings, notes and email"]},
    {"title":"Data & presentations","topics":["Spreadsheets and data analysis","Building slide decks with AI","Visualising insights"]},
    {"title":"Automation & ethics","topics":["No-code automations","Responsible and safe AI use","Capstone project"]}]'::jsonb,
  1
),
(
  'game-development-with-ai',
  'Game Development with AI',
  'Design, build and ship games faster with AI copilots.',
  'From idea to playable game. Use AI to generate assets, write game logic, design levels and build smarter NPCs while learning core game-development concepts.',
  35000, '10 weeks · live on Zoom', 'Beginner → Intermediate', 'gamepad',
  array['Game design fundamentals', 'AI-generated art, audio & assets', 'Coding gameplay with AI copilots', 'Publish your own game'],
  '[{"title":"Game design","topics":["Core loops and mechanics","Prototyping ideas with AI","Storytelling and worlds"]},
    {"title":"Building the game","topics":["Engine basics","Writing gameplay code with AI","Physics, input and UI"]},
    {"title":"AI-powered content","topics":["Generating sprites, textures and audio","Procedural levels","Smarter NPC behaviour"]},
    {"title":"Ship it","topics":["Testing and polish","Publishing to web and mobile","Capstone: your own game"]}]'::jsonb,
  2
),
(
  'mobile-and-web-app-dev-with-ai',
  'Mobile and Web Application Dev with AI',
  'Build real apps for web and mobile with AI pair-programming.',
  'Learn modern web and mobile development while using AI coding assistants to move fast. Build, deploy and maintain production-ready applications.',
  40000, '12 weeks · live on Zoom', 'Beginner → Intermediate', 'code',
  array['Modern web fundamentals', 'AI pair-programming workflows', 'APIs, databases & auth', 'Deploying real apps'],
  '[{"title":"Web foundations","topics":["HTML, CSS and JavaScript essentials","Working with AI coding assistants","Git and version control"]},
    {"title":"Front-end apps","topics":["Component-based UI","Responsive, mobile-first design","State and data fetching"]},
    {"title":"Back-end & data","topics":["APIs and databases","Authentication","Adding AI features to apps"]},
    {"title":"Mobile & deployment","topics":["Cross-platform mobile apps","Testing and debugging with AI","Capstone: deploy your app"]}]'::jsonb,
  3
),
(
  'digital-marketing-with-ai',
  'Digital Marketing with AI',
  'Grow brands with AI-driven content, ads and analytics.',
  'Plan, create and optimise digital campaigns with AI. Generate content, design creatives, target audiences and measure results across social, search and email.',
  25000, '8 weeks · live on Zoom', 'Beginner', 'megaphone',
  array['AI content & copywriting', 'Social media creatives', 'Ads, SEO & targeting', 'Analytics and reporting'],
  '[{"title":"Strategy","topics":["Digital marketing fundamentals","Audience research with AI","Brand voice and positioning"]},
    {"title":"Content creation","topics":["Copywriting with AI","Images and short-form video","Content calendars"]},
    {"title":"Growth channels","topics":["Social media marketing","SEO in the AI era","Paid ads and email"]},
    {"title":"Measure & optimise","topics":["Analytics dashboards","A/B testing with AI","Capstone campaign"]}]'::jsonb,
  4
)
on conflict (slug) do nothing;

-- ---------- Make yourself an admin ----------------------------------
-- After you sign up on the website, run (with your own email):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
