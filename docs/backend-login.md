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

This project uses `output: "export"`, so it has no Next.js server routes to read Twilio or service-role environment variables. Configure the WhatsApp sender under Supabase **Authentication → Providers → Phone**; do not add Twilio auth tokens or a Supabase `service_role` key to this frontend project. Supabase supports WhatsApp delivery through Twilio and Twilio Verify. See the [Supabase phone sign-in guide](https://supabase.com/docs/guides/auth/phone-login).

In Supabase **Authentication → URL Configuration**, allow these redirects:

- `https://project-collexus-ashy.vercel.app/login/`
- `http://localhost:3000/login/`

The live Collexus Supabase project has Email, Phone, and Google providers enabled, and new account signups are enabled. Google sign-in also needs the project's Google OAuth client to keep this Supabase callback URL registered:

`https://ewzbdgjcmvosaqiwekti.supabase.co/auth/v1/callback`

Do not replace the Supabase Site URL unless the app's canonical production domain changes. Add the Collexus login URL to the redirect allow-list so OAuth and email confirmation return to the active `.ashy` deployment.

## Configure WhatsApp OTP

New Collexus accounts use the phone number as their Supabase Auth identity. The signup form collects the user's name, account type, campus ID, and a **personal email for contact only**. It requests an OTP with Supabase Auth's `channel: "whatsapp"`; the user becomes signed in only after `verifyOtp` accepts the code with `type: "sms"`. The form requires an international number such as `+91 98765 43210`.

Enable the Phone provider in Supabase Auth and configure a WhatsApp sender with Twilio or Twilio Verify; Supabase currently supports WhatsApp delivery only through those providers. See the [Supabase phone sign-in guide](https://supabase.com/docs/guides/auth/phone-login) and [JavaScript OTP reference](https://supabase.com/docs/reference/javascript/auth-signinwithotp). If code delivery fails, check the Phone provider, Twilio WhatsApp sender, and Supabase Auth rate limits in the project dashboard.

The Auth trigger creates the private profile row from signup metadata when Supabase creates the pending Auth user. Unverified users receive no authenticated session, and profile table access is still restricted by RLS to the authenticated account owner. The trigger copies the name, account type, and campus ID; the personal email remains in Auth user metadata and is displayed as contact information, not as the login identity. Student and faculty labels are self-reported and do not grant campus access.

To avoid silently creating duplicate accounts, the WhatsApp **Sign in** flow only accepts an existing phone-auth account; email-only and Google accounts need a verified phone linked before using WhatsApp sign-in. Configure Supabase Auth rate limits and CAPTCHA before opening OTP requests to production traffic. Phone OTP providers can incur message charges.
