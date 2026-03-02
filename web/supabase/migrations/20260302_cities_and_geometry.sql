create table if not exists public.cities (
  id text primary key,
  name text not null,
  center_lat numeric(9,6) not null,
  center_lng numeric(9,6) not null,
  zoom integer not null default 12,
  created_at timestamptz not null default now()
);

insert into public.cities (id, name, center_lat, center_lng, zoom)
values
  ('default-city', 'Demo City', 13.082700, 80.270700, 12),
  ('chennai', 'Chennai', 13.082700, 80.270700, 12),
  ('bangalore', 'Bangalore', 12.971600, 77.594600, 12),
  ('singapore', 'Singapore', 1.352100, 103.819800, 11)
on conflict (id) do update set
  name = excluded.name,
  center_lat = excluded.center_lat,
  center_lng = excluded.center_lng,
  zoom = excluded.zoom;

alter table public.zones
  add column if not exists geometry jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'zones_city_id_fk'
  ) then
    alter table public.zones
      add constraint zones_city_id_fk
      foreign key (city_id) references public.cities(id)
      on update cascade on delete restrict;
  end if;
end $$;

alter table public.cities enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cities' and policyname = 'cities_select_public'
  ) then
    create policy "cities_select_public"
    on public.cities for select
    using (true);
  end if;
end $$;
