-- Read-only snapshot of the database's security setup.
-- Run in Supabase → SQL Editor. Changes nothing.
-- Rows: RLS flag per table, policies (public + storage), anon/authenticated grants,
-- public functions, auth users (who can log in to the admin app).

select 'rls' as kind,
       n.nspname || '.' || c.relname as object,
       case when c.relrowsecurity then 'enabled' else 'DISABLED' end as name,
       '' as roles, '' as cmd, '' as using_expr, '' as check_expr
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'

union all

select 'policy',
       schemaname || '.' || tablename,
       policyname,
       array_to_string(roles, ','),
       cmd,
       coalesce(qual, ''),
       coalesce(with_check, '')
from pg_policies
where schemaname in ('public', 'storage')

union all

select 'grant',
       table_schema::text || '.' || table_name::text,
       string_agg(privilege_type::text, ',' order by privilege_type::text),
       grantee::text, '', '', ''
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_schema, table_name, grantee

union all

select 'function',
       n.nspname || '.' || p.proname,
       case when p.prosecdef then 'security definer' else 'invoker' end,
       '', '', pg_get_function_identity_arguments(p.oid), ''
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'

union all

select 'auth_user',
       coalesce(email, '(no email)'),
       coalesce(raw_app_meta_data ->> 'provider', ''),
       coalesce(raw_app_meta_data ->> 'role', ''),
       created_at::text,
       coalesce(last_sign_in_at::text, ''),
       ''
from auth.users

order by 1, 2, 3;
