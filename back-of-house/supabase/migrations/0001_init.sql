-- Back of House: schema, row level security and the two database functions.
create extension if not exists pgcrypto;

-- People who sign in to the app (managers and baristas).
create table profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  role text not null default 'barista' check (role in ('manager', 'barista'))
);

-- Everyone who clocks in with a PIN, including people with no app login.
create table staff (
  id text primary key,
  name text not null,
  role text not null check (role in ('manager', 'barista', 'trainee')),
  pin_hash text not null,
  active boolean not null default true
);

create table shift_events (
  id uuid primary key default gen_random_uuid(),
  staff_id text not null references staff on delete cascade,
  kind text not null check (kind in ('in', 'out')),
  at timestamptz not null default now()
);
create index shift_events_at on shift_events (at desc);

create table inventory_items (
  id text primary key,
  name text not null,
  category text not null,
  unit text not null check (unit in ('g', 'ml', 'pcs')),
  quantity numeric not null default 0 check (quantity >= 0),
  reorder_at numeric not null,
  par numeric not null,
  pack_size numeric not null check (pack_size > 0),
  pack_label text not null,
  supplier text not null,
  updated_at timestamptz not null default now()
);

create table menu_items (
  id text primary key,
  name text not null,
  category text not null check (category in ('Coffee', 'Tea', 'Energy', 'Food')),
  temp text not null check (temp in ('hot', 'iced', 'any')),
  price numeric(6, 2) not null,
  sugar_free boolean not null default false,
  dairy_free boolean not null default false,
  caffeine text not null check (caffeine in ('none', 'low', 'medium', 'high')),
  comfort boolean not null default false
);

create table recipe_ingredients (
  menu_item_id text references menu_items on delete cascade,
  inventory_item_id text references inventory_items on delete restrict,
  amount numeric not null check (amount > 0),
  primary key (menu_item_id, inventory_item_id)
);

create table recipe_steps (
  menu_item_id text references menu_items on delete cascade,
  position int not null,
  instruction text not null,
  seconds int,
  tip text,
  primary key (menu_item_id, position)
);

create table usage_log (
  id uuid primary key default gen_random_uuid(),
  menu_item_id text not null references menu_items,
  size_oz int not null,
  made_by uuid references auth.users default auth.uid(),
  at timestamptz not null default now()
);

create table published_menus (
  id uuid primary key default gen_random_uuid(),
  menu_date date not null,
  item_ids text[] not null,
  special_id text,
  forecast jsonb not null,
  published_by uuid references auth.users default auth.uid(),
  published_by_name text not null,
  published_at timestamptz not null default now()
);
create index published_menus_date on published_menus (menu_date, published_at desc);

create table orders (
  id uuid primary key default gen_random_uuid(),
  lines jsonb not null,
  created_by uuid references auth.users default auth.uid(),
  created_by_name text not null,
  created_at timestamptz not null default now()
);

-- Who is on shift right now, without exposing PIN hashes.
create view staff_on_shift with (security_invoker = true) as
select s.id, s.name, s.role,
  case when last.kind = 'in' then last.at end as on_shift_since
from staff s
left join lateral (
  select e.kind, e.at from shift_events e where e.staff_id = s.id order by e.at desc limit 1
) last on true
where s.active;

-- ---------- helpers ----------
create function is_manager() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where user_id = auth.uid() and role = 'manager');
$$;

-- Clock someone in or out. The PIN is checked here, so hashes never leave the database.
create function clock_toggle(p_staff_id text, p_pin text)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare
  s staff;
  last_kind text;
  last_at timestamptz;
begin
  if auth.uid() is null then
    return query select false, 'Please sign in first.'; return;
  end if;
  select * into s from staff where id = p_staff_id and active;
  if not found then
    return query select false, 'We couldn''t find that person.'; return;
  end if;
  if s.pin_hash <> crypt(p_pin, s.pin_hash) then
    return query select false, 'That PIN doesn''t match. Try again or ask your manager.'; return;
  end if;
  select kind, at into last_kind, last_at from shift_events where staff_id = s.id order by at desc limit 1;
  if last_kind = 'in' then
    insert into shift_events (staff_id, kind) values (s.id, 'out');
    return query select true, format('%s clocked out after %s hours. See you soon!', split_part(s.name, ' ', 1),
      round(extract(epoch from now() - last_at) / 3600, 1));
  else
    insert into shift_events (staff_id, kind) values (s.id, 'in');
    return query select true, format('Welcome, %s. You''re clocked in.', split_part(s.name, ' ', 1));
  end if;
end $$;

-- Log one drink made and take its ingredients (and a cup) out of stock in one step.
create function record_made(p_menu_item_id text, p_size int)
returns void
language plpgsql security definer set search_path = public as $$
declare
  cat text;
  factor numeric := case when p_size = 16 then 1.33 else 1 end;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select category into cat from menu_items where id = p_menu_item_id;
  if not found then raise exception 'unknown menu item'; end if;
  if cat = 'Food' then factor := 1; end if;

  update inventory_items i
     set quantity = greatest(0, i.quantity - r.amount * factor), updated_at = now()
    from recipe_ingredients r
   where r.menu_item_id = p_menu_item_id and r.inventory_item_id = i.id;

  if cat <> 'Food' then
    update inventory_items set quantity = greatest(0, quantity - 1), updated_at = now()
     where id = case when p_size = 16 then 'cup16' else 'cup12' end;
  end if;

  insert into usage_log (menu_item_id, size_oz) values (p_menu_item_id, p_size);
end $$;

-- ---------- row level security ----------
alter table profiles enable row level security;
alter table staff enable row level security;
alter table shift_events enable row level security;
alter table inventory_items enable row level security;
alter table menu_items enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_steps enable row level security;
alter table usage_log enable row level security;
alter table published_menus enable row level security;
alter table orders enable row level security;

-- Signed-in team members can read everything they need.
create policy "team reads profiles" on profiles for select to authenticated using (true);
create policy "team reads shifts" on shift_events for select to authenticated using (true);
create policy "team reads inventory" on inventory_items for select to authenticated using (true);
create policy "team reads menu" on menu_items for select to authenticated using (true);
create policy "team reads ingredients" on recipe_ingredients for select to authenticated using (true);
create policy "team reads steps" on recipe_steps for select to authenticated using (true);
create policy "team reads published menus" on published_menus for select to authenticated using (true);
create policy "team reads orders" on orders for select to authenticated using (true);
create policy "team reads usage" on usage_log for select to authenticated using (true);

-- The staff table holds PIN hashes. Managers can add and edit staff; nobody can read pin_hash (see grants below).
create policy "managers manage staff" on staff for all to authenticated using (is_manager()) with check (is_manager());

-- Anyone on the team can update counts. Only managers change thresholds, menus and orders.
create policy "team updates counts" on inventory_items for update to authenticated using (true) with check (true);
create policy "managers publish menus" on published_menus for insert to authenticated with check (is_manager());
create policy "managers create orders" on orders for insert to authenticated with check (is_manager());
create policy "managers edit menu" on menu_items for all to authenticated using (is_manager()) with check (is_manager());

-- staff_on_shift runs as the caller, so the team gets a column-limited read: names and roles, never pin_hash.
revoke select on staff from authenticated;
grant select (id, name, role, active) on staff to authenticated;
create policy "team reads staff names" on staff for select to authenticated using (true);

-- Baristas may change quantity only, never thresholds or pack sizes.
revoke update on inventory_items from authenticated;
grant update (quantity, updated_at) on inventory_items to authenticated;
