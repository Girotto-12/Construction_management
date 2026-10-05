-- Foundation only: accounts are managed by Supabase Auth.
-- Run in a dedicated Obra Clara project, after selecting its organization.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.companies (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(trim(name)) between 2 and 100),
 created_by uuid not null references auth.users(id) on delete restrict,
 create_request uuid not null,
 created_at timestamptz not null default now(),
 unique(created_by, create_request)
);
create table public.company_memberships (
 company_id uuid not null references public.companies(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete restrict,
 role text not null check (role in ('admin','member')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key(company_id,user_id)
);
create index membership_user_active on public.company_memberships(user_id,company_id) where active;
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;

revoke all on public.companies,public.company_memberships from anon,authenticated;
grant select on public.companies,public.company_memberships to authenticated;
create policy membership_self_read on public.company_memberships for select to authenticated
 using(user_id=(select auth.uid()) and active);
create policy company_member_read on public.companies for select to authenticated
 using(exists(select 1 from public.company_memberships m where m.company_id=companies.id and m.user_id=(select auth.uid()) and m.active));

-- The only privilege-elevated operation bootstraps a NEW company plus its owner.
-- It cannot add a caller to an existing company or accept a caller-supplied owner.
create function private.create_company(company_name text,request_id uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare actor uuid:=auth.uid(); result uuid; existing_name text; clean_name text:=trim(company_name);
begin
 if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if request_id is null or clean_name is null or char_length(clean_name) not between 2 and 100 then
  raise exception 'Invalid company name or request' using errcode='22023';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text || request_id::text,0));
 select c.id,c.name into result,existing_name from public.companies c where c.created_by=actor and c.create_request=request_id;
 if result is not null then
  if existing_name<>clean_name then raise exception 'Idempotency conflict' using errcode='22023';end if;
  if not exists(select 1 from public.company_memberships m where m.company_id=result and m.user_id=actor and m.active) then
   raise exception 'Access revoked' using errcode='42501';
  end if;
  return result;
 end if;
 insert into public.companies(name,created_by,create_request) values(clean_name,actor,request_id) returning id into result;
 insert into public.company_memberships(company_id,user_id,role) values(result,actor,'admin');
 return result;
end;
$$;
revoke all on function private.create_company(text,uuid) from public,anon;
grant execute on function private.create_company(text,uuid) to authenticated;

create function public.create_company(company_name text,request_id uuid)
returns uuid language sql security invoker set search_path=''
as $$ select private.create_company(company_name,request_id); $$;
revoke all on function public.create_company(text,uuid) from public,anon;
grant execute on function public.create_company(text,uuid) to authenticated;
