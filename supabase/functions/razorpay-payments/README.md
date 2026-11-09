# `razorpay-payments` Edge Function

This function exposes authenticated `create_order` and `verify_payment` actions and an unauthenticated Razorpay webhook receiver. It never accepts a payment amount from the caller: order creation loads `amount_paise` and currency from the server-owned `payments` row. Checkout verification checks the HMAC, fetches the payment from Razorpay, and only records a captured payment as paid. Webhook signatures are checked against the untouched request bytes.

## Function contract

Invoke with a Supabase user access token:

```json
{ "action": "create_order", "payment_id": "<server-created payment UUID>" }
```

```json
{
  "action": "verify_payment",
  "payment_id": "<server-created payment UUID>",
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "<checkout signature>"
}
```

Configure Razorpay to send payment webhooks to `/functions/v1/razorpay-payments`. Webhooks are identified by `X-Razorpay-Signature` and `x-razorpay-event-id` and do not use a user JWT.

## Database contract

Apply `supabase/migrations/20261107190000_payments_and_checkout.sql` before connecting the deployed web application. It creates `payments` and `payment_webhook_events`, plus trusted event-ticket and food-order records. RLS is enabled and direct `anon`/`authenticated` access is revoked. The function uses the Supabase server key only after validating the user's session and payment ownership.

The web checkout creates payment rows only from a server-validated ticket or active menu price. A generic client-submitted amount is intentionally unsupported. Event tickets default inactive and the cart displays no sample products; populate real event ticket prices and activate real stall menus before taking Test Mode orders.

## Secrets and deployment

Set these Edge Function secrets in Supabase for Test Mode first:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `PAYMENTS_ALLOWED_ORIGINS` (comma-separated exact origins; defaults to the Collexus production origins)

The function also uses Supabase's built-in `SUPABASE_URL`, `SUPABASE_ANON_KEY`/publishable key, and `SUPABASE_SERVICE_ROLE_KEY`/secret key. Keep the service key in the Edge Function runtime only. The Supabase gateway must set JWT verification off for this function because Razorpay webhooks have no Supabase JWT; the function verifies JWTs itself on student actions and HMAC on webhook requests.

After the required tables exist, link the CLI and deploy manually:

```sh
supabase link --project-ref ewzbdgjcmvosaqiwekti
supabase functions deploy razorpay-payments --no-verify-jwt
```

Set the three Razorpay secrets and allowed origins in **Supabase Dashboard → Edge Functions → Secrets** before enabling the webhook. Do not commit keys or pass them as command-line arguments. Configure the Razorpay webhook URL as `https://ewzbdgjcmvosaqiwekti.supabase.co/functions/v1/razorpay-payments` and use the same `RAZORPAY_WEBHOOK_SECRET` value there.
