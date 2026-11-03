-- KnowAboutSSR — Phase 1 schema
-- Run once in Supabase Dashboard → SQL Editor.
-- Customers sign in ANONYMOUSLY (Supabase anonymous auth) so RLS can scope
-- their orders/chats to auth.uid() without them creating an account.

create extension if not exists pgcrypto;

-- ───────────── Admin users ─────────────
create table public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- A user may only see their own row (used by /admin middleware).
-- No insert/update/delete policies: admins are added only via the SQL editor.
create policy "admin reads own row" on public.admin_users
  for select to authenticated using (id = auth.uid());

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ───────────── Website settings (key/value, editable from admin) ─────────────
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
create policy "settings public read" on public.settings for select using (true);
create policy "settings admin write" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Categories (services + portfolio) ─────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('service','portfolio')),
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  unique (kind, slug)
);
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Services ─────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price_inr integer not null check (price_inr >= 0),
  image_path text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
create policy "services public read" on public.services for select using (true);
create policy "services admin write" on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Portfolio ─────────────
create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  image_path text,
  project_date date default current_date,
  external_url text,
  status text not null default 'completed' check (status in ('completed','pending')),
  created_at timestamptz not null default now()
);
alter table public.portfolio_projects enable row level security;
create policy "portfolio public read" on public.portfolio_projects for select using (true);
create policy "portfolio admin write" on public.portfolio_projects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Testimonials (none seeded; publish only real ones) ─────────────
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  body text not null,
  rating int check (rating between 1 and 5),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
create policy "testimonials public read" on public.testimonials
  for select using (is_published);
create policy "testimonials admin all" on public.testimonials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Customers ─────────────
create table public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.customers enable row level security;
create policy "customer insert self" on public.customers
  for insert to authenticated with check (id = auth.uid());
create policy "customer read self" on public.customers
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "customer update self" on public.customers
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "customers admin all" on public.customers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Orders ─────────────
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique
    default ('SSR-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8))),
  customer_id uuid not null references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null default '',
  price_inr integer not null default 0,
  customer_name text not null,
  requirements text not null default '',
  reference_images text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','submitted','paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.orders (customer_id);
create index on public.orders (status);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- Never trust client-sent price/name: copy from the services table.
create or replace function public.orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare s public.services;
begin
  select * into s from public.services where id = new.service_id;
  if not found then raise exception 'Unknown service'; end if;
  if not s.is_available then raise exception 'Service is currently unavailable'; end if;
  new.service_name := s.name;
  new.price_inr := s.price_inr;
  return new;
end $$;
create trigger orders_set_price before insert on public.orders
  for each row execute function public.orders_before_insert();

alter table public.orders enable row level security;
create policy "orders customer insert" on public.orders
  for insert to authenticated
  with check (customer_id = auth.uid() and status = 'pending' and payment_status = 'unpaid');
create policy "orders customer read" on public.orders
  for select to authenticated using (customer_id = auth.uid());
create policy "orders admin all" on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Internal notes live in their own admin-only table (customers can read their orders).
create table public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);
alter table public.order_notes enable row level security;
create policy "order_notes admin all" on public.order_notes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ───────────── Chat ─────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid unique references public.orders(id) on delete set null,
  customer_name text not null default '',
  status text not null default 'open' check (status in ('open','resolved')),
  unread_admin int not null default 0,
  unread_customer int not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on public.conversations (customer_id);
alter table public.conversations enable row level security;
create policy "conv customer insert" on public.conversations
  for insert to authenticated
  with check (
    customer_id = auth.uid() and status = 'open'
    and unread_admin = 0 and unread_customer = 0
    and (order_id is null or exists (
      select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()))
  );
create policy "conv customer read" on public.conversations
  for select to authenticated using (customer_id = auth.uid());
create policy "conv admin all" on public.conversations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','admin')),
  body text not null default '',
  image_path text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (length(trim(body)) > 0 or image_path is not null),
  check (length(body) <= 4000)
);
create index on public.messages (conversation_id, created_at);
alter table public.messages enable row level security;
create policy "msg customer insert" on public.messages
  for insert to authenticated
  with check (
    sender_role = 'customer' and read_at is null
    and exists (select 1 from public.conversations c
                where c.id = conversation_id and c.customer_id = auth.uid()));
create policy "msg customer read" on public.messages
  for select to authenticated
  using (exists (select 1 from public.conversations c
                 where c.id = conversation_id and c.customer_id = auth.uid()));
create policy "msg admin all" on public.messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Keep unread counters + last_message_at in sync.
create or replace function public.messages_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set
    last_message_at = new.created_at,
    unread_admin = unread_admin + (case when new.sender_role = 'customer' then 1 else 0 end),
    unread_customer = unread_customer + (case when new.sender_role = 'admin' then 1 else 0 end),
    status = case when new.sender_role = 'customer' then 'open' else status end
  where id = new.conversation_id;
  return new;
end $$;
create trigger messages_sync after insert on public.messages
  for each row execute function public.messages_after_insert();

-- Reset unread counters for whoever opens the conversation.
create or replace function public.mark_conversation_read(p_conversation uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    update public.conversations set unread_admin = 0 where id = p_conversation;
    update public.messages set read_at = now()
      where conversation_id = p_conversation and sender_role = 'customer' and read_at is null;
  else
    update public.conversations set unread_customer = 0
      where id = p_conversation and customer_id = auth.uid();
    update public.messages set read_at = now()
      where conversation_id = p_conversation and sender_role = 'admin' and read_at is null
        and exists (select 1 from public.conversations c
                    where c.id = p_conversation and c.customer_id = auth.uid());
  end if;
end $$;

-- ───────────── Payments (manual UPI verification) ─────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount_inr integer not null check (amount_inr >= 0),
  method text not null default 'UPI',
  reference text,                     -- UTR / transaction ref entered by customer
  status text not null default 'submitted'
    check (status in ('submitted','verified','rejected')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
alter table public.payments enable row level security;
create policy "payments customer insert" on public.payments
  for insert to authenticated
  with check (status = 'submitted' and exists (
    select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "payments customer read" on public.payments
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "payments admin all" on public.payments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Orders are marked paid ONLY when the admin verifies a payment record.
create or replace function public.payments_sync_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'verified' then
    update public.orders set payment_status = 'paid' where id = new.order_id;
  elsif new.status = 'submitted' then
    update public.orders set payment_status = 'submitted'
      where id = new.order_id and payment_status = 'unpaid';
  elsif new.status = 'rejected' then
    update public.orders set payment_status = 'unpaid'
      where id = new.order_id and payment_status = 'submitted';
  end if;
  return new;
end $$;
create trigger payments_sync after insert or update of status on public.payments
  for each row execute function public.payments_sync_order();

-- ───────────── Storage ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-images', 'site-images', true, 5242880,
   array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('chat-attachments', 'chat-attachments', false, 5242880,
   array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

create policy "site-images admin write" on storage.objects for all to authenticated
  using (bucket_id = 'site-images' and public.is_admin())
  with check (bucket_id = 'site-images' and public.is_admin());
create policy "chat upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-attachments'
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "chat read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'chat-attachments'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ───────────── Realtime ─────────────
alter publication supabase_realtime add table public.messages, public.conversations, public.orders;

-- ───────────── Seed data (from your spec) ─────────────
insert into public.categories (kind, name, slug, sort_order) values
  ('service','Website & Development','website-development',1),
  ('service','Graphic Designing','graphic-designing',2),
  ('service','Video & Audio','video-audio',3),
  ('service','Optimization','optimization',4),
  ('service','AI Services','ai-services',5),
  ('portfolio','Websites','websites',1),
  ('portfolio','Minecraft Mods','minecraft-mods',2),
  ('portfolio','Minecraft Plugins','minecraft-plugins',3),
  ('portfolio','Thumbnails','thumbnails',4),
  ('portfolio','3D Designs','3d-designs',5),
  ('portfolio','Wallpapers','wallpapers',6),
  ('portfolio','Other Projects','other-projects',7);

insert into public.services (category_id, name, description, price_inr, sort_order)
select c.id, v.name, v.descr, v.price, v.ord
from (values
  ('website-development','Website Development','Custom responsive website built to your requirements.',1500,1),
  ('website-development','Minecraft Datapack','Custom Minecraft datapack.',400,2),
  ('website-development','Minecraft Plugin','Custom Minecraft server plugin.',600,3),
  ('website-development','Minecraft Mod','Custom Minecraft mod.',800,4),
  ('graphic-designing','Thumbnail','Eye-catching thumbnail design.',1500,1),
  ('graphic-designing','3D Thumbnail','Thumbnail with 3D elements.',1900,2),
  ('graphic-designing','Modded Thumbnail','Thumbnail designed for modded content.',2000,3),
  ('graphic-designing','Windows Custom Wallpaper','Custom wallpaper for Windows.',400,4),
  ('graphic-designing','Android Custom Wallpaper','Custom wallpaper for Android.',200,5),
  ('video-audio','Video Script','Written script for your video.',1200,1),
  ('video-audio','Real Voice Over','Recorded human voice over.',1000,2),
  ('video-audio','AI Voice Over','AI-generated voice over.',600,3),
  ('video-audio','Video Editing','Video editing for your footage.',300,4),
  ('optimization','Medium Windows Optimization','Medium-level Windows performance tuning.',200,1),
  ('optimization','Heavy Windows Optimization','Deep Windows performance tuning.',500,2),
  ('optimization','Android Optimization','Android performance tuning.',100,3),
  ('ai-services','AI Prompts','Custom AI prompts.',100,1),
  ('ai-services','AI Website Course','Course on building websites with AI.',700,2),
  ('ai-services','AI Thumbnail Course','Course on making thumbnails with AI.',800,3)
) as v(slug, name, descr, price, ord)
join public.categories c on c.slug = v.slug and c.kind = 'service';

insert into public.settings (key, value) values
  ('site',        '{"name":"KnowAboutSSR","owner":"Shivam Singh Rajput","hometown":"Delhi, India","status":"Earning / Available for Projects","maintenance_mode":false,"hero_blend":false}'),
  ('profile',     '{"professions":["Website Developer","UI/UX Designer","Graphics Artist","Part-time Content Creator","Full-time Student"],"intro":"I am Shivam Singh Rajput, a creative website developer, designer, and graphics artist with 3 years of experience.","about":"","working_style":"Freelance / Independent Projects","goal":"Make Some Side Income"}'),
  ('stats',       '{"experience_years":3,"completed_projects":45,"pending_projects":0}'),
  ('skills',      '["Website Development","Graphic Designing","Thumbnail Designing","Minecraft Mod Development","Minecraft Plugin Development","UI/UX Designing","AI Prompt Engineering","Video Editing","Windows Optimization"]'),
  ('contact',     '{"email":"parlegez@gmail.com","discord":"Coming Soon"}'),
  ('socials',     '{"instagram":[{"handle":"its.shivamsr","url":"https://www.instagram.com/its.shivamsr/"},{"handle":"uff.shivamsr","url":"https://www.instagram.com/uff.shivamsr/"}],"youtube":{"handle":"Mrhekkaro","url":"https://www.youtube.com/@Mrhekkaro"}}'),
  ('payment',     '{"method":"UPI","upi_id":"its.shivamsr@fam","qr_path":null,"instructions":""}'),
  ('announcement','{"enabled":false,"text":""}');

-- ───────────── Create YOUR admin (run AFTER creating the user in Auth) ─────────────
-- insert into public.admin_users (id, email)
-- select id, email from auth.users where email = 'parlegez@gmail.com';
