-- Store the full app state as a JSON blob on the profile row.
-- This lets the client sync without mapping local IDs to relational tables.
alter table public.profiles add column if not exists data jsonb;
