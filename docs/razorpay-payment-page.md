# Razorpay payment page

The PRAKALP 2026 registration route links to the hosted Razorpay payment page configured on the event in `data/events.ts`. Razorpay hosts checkout and handles the payment; no Razorpay API credentials are needed to open this public link.

This Next.js app uses `output: "export"` and has no runtime API routes. The hosted link does not send payment status or registration details back to Collexus, so the site must not mark an attendee as paid or registered based on the return page. To reconcile registrations automatically, add a trusted backend or Supabase Edge Function and configure a Razorpay webhook with signature verification. Store its webhook secret in the backend platform's secrets, never in this repository or a `NEXT_PUBLIC_*` variable.
