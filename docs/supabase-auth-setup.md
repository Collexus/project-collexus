# Supabase Auth setup

The login page uses Supabase Auth in the browser. The GitHub Pages build can show the page before credentials are configured, but sign-in, signup, password recovery, and Google OAuth remain disabled until the public project settings are added.

## GitHub Pages build variables

In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add:

- `NEXT_PUBLIC_SUPABASE_URL`: the project URL from Supabase **Project Settings → API**.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key from the same settings page. The legacy anon key is also accepted by the client as a fallback.

These are public browser values. Never put a Supabase `service_role` or secret key in a `NEXT_PUBLIC_*` variable or in this repository.

The Pages workflow reads these variables at build time. After adding or changing them, run the workflow again (or push a commit) to rebuild the static site.

## Supabase providers and redirects

In Supabase **Authentication → Providers**, enable Email and Google. Configure the Google OAuth client ID and secret in Supabase; Google should redirect to the callback URL shown on that provider settings page.

In **Authentication → URL Configuration**, set the Site URL to:

`https://sridhargurram534.github.io/collexus/`

Add this redirect URL to the allowed list:

`https://sridhargurram534.github.io/collexus/login/`

Email confirmation is recommended. The page asks new users to verify their email before signing in. Supabase's confirmation and recovery emails must be configured for the project.

## Account roles and authorization

Student, faculty, and guest are profile labels collected during signup. Student IDs and faculty IDs are not verified by this static page. Do not use those client-provided labels to authorize protected data or privileged actions. Enforce access with Supabase Row Level Security and trusted server-side verification or claims. A GitHub Pages site cannot safely hold server secrets.
