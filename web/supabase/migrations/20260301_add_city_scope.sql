alter table public.zones
  add column if not exists city_id text;

update public.zones
set city_id = 'default-city'
where city_id is null;

alter table public.zones
  alter column city_id set default 'default-city';

alter table public.zones
  alter column city_id set not null;

create index if not exists zones_city_id_idx on public.zones (city_id);
