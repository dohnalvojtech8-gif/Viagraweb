create table public.shop_records (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
alter table public.shop_records enable row level security;
revoke all on public.shop_records from public, anon, authenticated;
grant select,insert,update,delete on public.shop_records to service_role;
create index shop_records_key_prefix_idx on public.shop_records (key text_pattern_ops);
