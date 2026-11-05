# Collexus admin console

The protected workspace is available at `/admin`. It provides live profile
and review counts, event-submission moderation, role assignments, and an
administrative audit history. Server Actions re-check the authenticated
administrator role, validate submitted values, write changes and audit rows
in one transaction, and refresh the page data. Staff accounts can be assigned
to individual events; removing the staff role revokes their event assignments.
The reusable `requireEventStaff` guard requires both the staff role and an
active assignment for the requested event.

## Admin signup and sign-in

When email confirmation is required, the signup panel switches to a 6-digit
code form. After the code is verified, an administrator continues to TOTP
enrollment or verification before entering the workspace.

The dedicated access panel is available at `/admin/login/`. It supports
Supabase email/password sign-in and account creation, and sends a fresh
Cloudflare Turnstile token with each auth request. Add the local and deployed
admin login URLs to Supabase **Authentication → URL Configuration → Redirect
URLs** so email verification returns to the panel.

Signup creates a Supabase Auth account only. It never assigns an administrator
role. Verify the email first, then use the first-admin bootstrap below for the
trusted initial administrator. Later account signup does not grant admin
access; an active administrator assigns the role from the protected workspace.

## Required administrator two-factor authentication

Every admin role requires a Supabase Auth TOTP authenticator before the
workspace or its Server Actions can be used. After password sign-in, admins
are sent to /admin/mfa/. The first sign-in enrolls an authenticator app and
requires a code from it to finish setup; subsequent sign-ins require a fresh
6-digit code. The server also checks Supabase's aal2 assurance level on each
admin page and action request.

In Supabase, open Authentication → Settings → Multi-factor Authentication
and ensure TOTP enrollment and verification are enabled. Keep the Supabase
Auth URL configuration pointed at the app's deployment URLs as described
above. No extra application package or environment secret is required.

## Local database configuration

Set `DATABASE_URL` in `.env.local` to the Supabase PostgreSQL connection string
used by the running app. `DIRECT_URL` may contain the direct database URL for
Prisma migrations; `prisma.config.ts` uses it when it is present. Keep both
server-only and never put database credentials in a `NEXT_PUBLIC_*` variable.

After reviewing the target database, run `npm run db:generate` and
`npm run db:migrate:deploy`. Without `DATABASE_URL`, the admin dashboard cannot
resolve roles or load records. No database URL is checked into this repository.

## Database setup

The migration `20261105000000_admin_console` adds review metadata, the
multi-role and staff-event assignment tables, and the audit log. It preserves the existing
`user_roles` and `event_submissions` records. Apply the migration with the
database migration runner used by this deployment; do not apply it to a
production database until the target and backup have been reviewed.

## Grant the first administrator

Administrator roles are never derived from email, account metadata, or a
client-side value. After applying the migration, select the trusted account
in Supabase Auth, copy its UUID, replace the placeholder below, and run this
statement in the Supabase SQL editor:

```sql
with target_account as (
  select id
  from auth.users
  where id = 'REPLACE_WITH_TRUSTED_AUTH_USER_UUID'::uuid
    and email_confirmed_at is not null
), role_assignment as (
  insert into public.user_role_assignments (user_id, role, assigned_by)
  select id, 'admin', id
  from target_account
  on conflict (user_id, role)
  do update set assigned_by = excluded.assigned_by, revoked_at = null
  returning user_id
)
insert into public.user_roles (user_id, role)
select user_id, 'admin'
from role_assignment
on conflict (user_id)
do update set role = 'admin';
```

This bootstrap is explicit and uses the selected Auth UUID; it does not
create or expose credentials. Later role changes can be managed in the
admin workspace and are audited.

## Current data boundaries

The published RCEE catalog remains source-managed in `data/events.ts`. Event
submission approval records the moderation decision; it does not publish a
new catalog record. Admin event assignments can target the current verified
catalog entries, but this console does not yet create or publish event records.
This repository does not yet contain account suspension, food order, stall,
payment, or registration tables, so the console does not show sample or
fabricated records for those areas. Those capabilities need their domain
models, policies, and workflows before they can be managed safely here.
