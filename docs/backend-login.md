# Login and profile backend

Collexus uses Supabase Auth from the browser. The Next.js build currently uses `output: "export"`, so it has no runtime API routes or server-only environment. Authenticated profile reads and writes go directly to Supabase and are restricted by row-level security (RLS).

## Apply the profile migration

Run [`supabase/migrations/20261024000000_profiles.sql`](../supabase/migrations/20261024000000_profiles.sql) against the Supabase project used by Collexus. In the Supabase dashboard, open **SQL Editor**, paste the migration contents, and run it. The migration creates a private profile for each new Auth user, backfills existing Auth metadata, and allows authenticated users to read and update only their own profile row.

The account type and campus ID are self-reported profile values. They are not proof of student or faculty status and must not grant privileged access.

## Configure the deployed login

The production Vercel project already has these public browser variables. If creating another deployment, set them before building:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

For local development, put the same two values in `.env.local` at the repository root and restart `npm run dev`.

Never expose a Supabase `service_role` or secret key in a `NEXT_PUBLIC_*` variable or browser code.

In Supabase **Authentication → URL Configuration**, allow these redirects:

- `https://project-collexus-ashy.vercel.app/login/`
- `http://localhost:3000/login/`

The live Collexus Supabase project has Email, Phone, and Google providers enabled, and new account signups are enabled. Google sign-in also needs the project's Google OAuth client to keep this Supabase callback URL registered:

`https://ewzbdgjcmvosaqiwekti.supabase.co/auth/v1/callback`

Do not replace the Supabase Site URL unless the app's canonical production domain changes. Add the Collexus login URL to the redirect allow-list so OAuth and email confirmation return to the active `.ashy` deployment.

## Configure WhatsApp OTP

The login page sends phone OTPs with Supabase Auth's `channel: "whatsapp"` and verifies them with `verifyOtp` using `type: "sms"`. Enable the Phone provider in Supabase Auth and configure a WhatsApp sender with Twilio or Twilio Verify; Supabase currently supports WhatsApp delivery only through those providers. See the [Supabase phone sign-in guide](https://supabase.com/docs/guides/auth/phone-login) and [JavaScript OTP reference](https://supabase.com/docs/reference/javascript/auth-signinwithotp).

Signups through WhatsApp collect the user's name, account type, and campus ID before sending the code. The migration's Auth trigger copies those values into the profile after phone verification. The login form requires an international phone number such as `+91 98765 43210`. To avoid silently creating duplicate accounts, the WhatsApp **Sign in** flow only accepts an existing phone-auth account; email-only and Google accounts need a verified phone linked before using WhatsApp sign-in.

Configure Supabase Auth rate limits and CAPTCHA before opening OTP requests to production traffic. Phone OTP providers can incur message charges.
