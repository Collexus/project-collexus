# Login and profile backend

Collexus uses Supabase Auth from the browser. The Next.js build currently uses `output: "export"`, so it has no runtime API routes or server-only environment. Authenticated profile reads and writes go directly to Supabase and are restricted by row-level security (RLS).

## Apply the profile migration

Run [`supabase/migrations/20261024000000_profiles.sql`](../supabase/migrations/20261024000000_profiles.sql) against the Supabase project used by Collexus. In the Supabase dashboard, open **SQL Editor**, paste the migration contents, and run it. The migration creates a private profile for each new Auth user, backfills existing Auth metadata, and allows authenticated users to read and update only their own profile row.

The account type and campus ID are self-reported profile values. They are not proof of student or faculty status and must not grant privileged access.

## Configure the deployed login

The production Vercel project already has these public browser variables. If creating another deployment, set them before building:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

For local development, copy `.env.example` to `.env.local`, fill in the Supabase URL and publishable key, and restart `npm run dev`. `.env.local` is ignored by Git.

This project uses `output: "export"`, so it has no Next.js server routes to read provider secrets or a Supabase `service_role` key. Keep provider credentials out of this frontend project.

In Supabase **Authentication → URL Configuration**, allow these redirects:

- `https://project-collexus-ashy.vercel.app/login/`
- `https://collexus.in/login/`
- `https://www.collexus.in/login/`
- `http://localhost:3000/login/`

The live Collexus Supabase project has Email, Phone, and Google providers enabled, and new account signups are enabled. New accounts use a college email as their Auth identity and receive a one-time email code. Existing phone-auth accounts can still sign in through the optional WhatsApp path. Google sign-in also needs the project's Google OAuth client to keep this Supabase callback URL registered:

`https://ewzbdgjcmvosaqiwekti.supabase.co/auth/v1/callback`

Do not replace the Supabase Site URL unless the app's canonical production domain changes. Keep the Collexus production login URL and any preview URL under test in the redirect allow-list so OAuth and email confirmation return to the correct deployment.

## Configure email OTP

Signup collects the user's name, account type, campus ID, college email, and international phone number. Supabase Auth uses the email as the account identity and sends a six-digit code with `signInWithOtp`; the session is created only after `verifyOtp` accepts it with `type: "email"`. The phone number is stored as unverified contact information in Auth metadata and is not used for authentication. Use an email inbox the person can access. The form labels it as a college email but does not guess or enforce a college domain.

In Supabase **Authentication → Email Templates → Magic Link**, configure the message to display `{{ .Token }}` when the user needs a code instead of a clickable sign-in link. Supabase's default auth email sender is rate-limited; configure custom SMTP for reliable production delivery and higher limits. See the [Supabase passwordless email guide](https://supabase.com/docs/guides/auth/auth-email-passwordless), [email template guide](https://supabase.com/docs/guides/auth/auth-email-templates), and [JavaScript OTP reference](https://supabase.com/docs/reference/javascript/auth-signinwithotp). Add the deployed `/login/` URL to Supabase's redirect allow-list.

The Auth trigger creates the private profile row from signup metadata when Supabase creates the pending Auth user. Unverified users receive no authenticated session, and profile table access is still restricted by RLS to the authenticated account owner. The trigger copies the name, account type, and campus ID. Student and faculty labels are self-reported and do not grant campus access.

Existing phone-auth accounts can use the optional WhatsApp sign-in form. That path only accepts an existing account; it does not create new phone-only accounts. To keep it available, leave the Phone provider enabled and configure a WhatsApp sender through Twilio or Twilio Verify. See the [Supabase phone sign-in guide](https://supabase.com/docs/guides/auth/phone-login). Configure Auth rate limits and CAPTCHA before opening OTP requests to production traffic.
