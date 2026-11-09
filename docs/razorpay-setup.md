# Razorpay integration status and setup

## Repository audit

- The app is Next.js 16.4 with TypeScript and App Router.
- Supabase Auth sessions are validated server-side. Prisma connects to the existing Supabase PostgreSQL database for privileged application data.
- The database migration history previously had no event registrations, food orders, payment ledger, or webhook inbox. The additive checkout migration now creates these records and missing stall/menu tables.
- Event registration and food ordering now read prices from server-owned ticket and menu records. Browser-submitted prices are never used. Event tickets default inactive; checkout is unavailable until the event team publishes an active ticket price. Food checkout is unavailable until an administrator activates a stall and available menu items.
- No prior Razorpay integration or credentials were found in the repository environment variable names.

## Implemented foundation

`lib/payments/razorpay.ts` provides server-only Razorpay Orders API creation, payment lookup, checkout signature verification, and raw-body webhook signature verification. `createRazorpayOrder` accepts paise and is documented for use only after the server loads the amount from a trusted purchase record. The app environment validator now accepts Razorpay server credentials and rejects an incomplete API key pair.

The live menu-backed cart and event-ticket registration paths now create purchase and payment records through authenticated Next.js routes, then call the deployed `razorpay-payments` Edge Function for order creation and server-side payment verification. A database trigger confirms the associated event registration or food order only when the payment row becomes `paid`.

## Required configuration

1. Confirm the Razorpay merchant account is eligible and authorized to collect Collexus payments. Confirm college authorization and the correct merchant arrangement before production collection.
2. Start in Razorpay Test Mode and create a Test Key ID and Key Secret.
3. Add these server-side variables to local `.env.local` or the appropriate Vercel environment. Never use a `NEXT_PUBLIC_` prefix for secrets:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
4. Configure the webhook URL after deploying the webhook handler. Subscribe to `payment.captured`, `payment.failed`, and `order.paid`. Use a separate webhook secret for each Razorpay mode.

## Required rollout steps

1. The additive migration `supabase/migrations/20261107190000_payments_and_checkout.sql` creates missing stall/admin tables and payment records, while denying direct client access with RLS and grants.
2. Ensure the Vercel project has `NEXT_PUBLIC_SUPABASE_URL`, its publishable key, and `DATABASE_URL` configured. Razorpay secrets remain in Supabase Edge Function secrets; do not add them to browser-prefixed environment variables.
3. Deploy the web application. The function must already be deployed as `razorpay-payments` and allow the production site origin.
4. Create/activate food stalls and menu entries in the admin panel. Add event ticket types only after confirming an event's actual price and sales window; leave `is_active` false until approved.
5. Complete a small Test Mode event registration and food order, verify order status/history and webhook delivery, and reconcile with Razorpay before enabling live keys.

Live collection remains off until Test Mode flows pass and the merchant arrangement is approved.
