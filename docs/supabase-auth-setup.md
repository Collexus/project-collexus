# Supabase Auth setup

The login page uses Supabase Auth in the browser. The GitHub Pages build can show the page before credentials are configured, but sign-in, signup, password recovery, and Google OAuth remain disabled until the public project settings are added.

## GitHub Pages build variables

In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add:

- `NEXT_PUBLIC_SUPABASE_URL`: the project URL from Supabase **Project Settings → API**.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key from the same settings page. The legacy anon key is also accepted by the client as a fallback.

These are public browser values. Never put a Supabase `service_role` or secret key in a `NEXT_PUBLIC_*` variable or in this repository.

The Pages workflow reads these variables at build time. After adding or changing them, run the workflow again (or push a commit) to rebuild the static site.

## Profile database setup

The browser client already uses the Supabase project URL and publishable key above. Profile data is stored in `public.profiles`; sign-in working confirms the client can reach Supabase, but GitHub Pages does not apply database schema changes. Run these SQL files in the Supabase **SQL Editor**, in timestamp order, before enabling profile saves or photo uploads:

1. `supabase/migrations/20261024000000_profiles.sql`
2. `supabase/migrations/20261031000000_profile_contact_fields.sql`
3. `supabase/migrations/20261101000000_profile_photo_storage.sql` (profile photos only)

The first migration creates the private profile table and its own-row policies. The second adds contact fields used by the profile editor. The third creates the private photo bucket and per-user storage policies. Keep the publishable key in the browser; never put a service-role key in the site or a `NEXT_PUBLIC_*` variable.

## Supabase providers and redirects

In Supabase **Authentication → Providers**, enable Email and Google. Configure the Google OAuth client ID and secret in Supabase; Google should redirect to the callback URL shown on that provider settings page.

In **Authentication → URL Configuration**, set the Site URL to:

`https://sridhargurram534.github.io/collexus/`

Add this redirect URL to the allowed list:

`https://sridhargurram534.github.io/collexus/login/`

Also allow the admin signup email-verification return URLs:

- `https://sridhargurram534.github.io/collexus/admin/login/`
- `http://localhost:3000/admin/login/` (local development)

The admin access panel supports email/password sign-in and signup. After
signup, it opens a 6-digit email confirmation form; successful verification
continues to administrator authenticator verification. In Supabase
Authentication → Email Templates → Confirm signup, include the OTP token in
the email template so the recipient can enter it in the page:

    <h2>Confirm your email</h2>
    <p>Enter this 6-digit code in the Collexus signup page:</p>
    <p><strong>{{ .Token }}</strong></p>

Keep the confirmation URL available if you want to support email-link
confirmation as well. Signup does not grant the administrator role; use the
trusted first-admin SQL bootstrap in docs/admin-console.md after the admin
database migration is applied.

## Local Turnstile troubleshooting

The local app runs on localhost. Add localhost to the Cloudflare Turnstile
widget's Hostname Management list if it is not already allowed. The admin
page displays the Turnstile error code: Cloudflare's 110200 means the current
hostname is not authorized; 300-series and 600-series errors are generic
challenge failures. Try the local site in a regular browser window with
extensions or VPN disabled, or use a different network. Supabase's
invalid_credentials response means the configured project did not accept the
email/password; check that the user exists and is confirmed in that same
Supabase project.

Email confirmation is recommended. The page asks new users to verify their email before signing in. Supabase's confirmation and recovery emails must be configured for the project.

## Account roles and authorization

Student, faculty, and guest are profile labels collected during signup. Student IDs and faculty IDs are not verified by this static page. Do not use those client-provided labels to authorize protected data or privileged actions. Enforce access with Supabase Row Level Security and trusted server-side verification or claims. A GitHub Pages site cannot safely hold server secrets.
