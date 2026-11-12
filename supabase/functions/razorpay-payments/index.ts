import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-razorpay-signature, x-razorpay-event-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const maxBodyBytes = 16_000;
const timeoutMs = 15_000;

type PaymentRecord = {
  id: string;
  user_id: string;
  amount_paise: number;
  currency: string;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  order_creation_started_at: string | null;
};

type RazorpayOrder = { id: string; amount: number; currency: string; status: string };
type RazorpayPayment = {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
};

function json(body: unknown, status = 200, origin?: string) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders, ...(origin ? { "Access-Control-Allow-Origin": origin } : {}) },
  });
}

function getCorsOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (Deno.env.get("PAYMENTS_ALLOWED_ORIGINS") ?? "https://collexus.in,https://www.collexus.in")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : undefined;
}

function getSupabaseSecretKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") as Record<string, string>;
    return keys.default;
  } catch {
    return undefined;
  }
}

function getSupabasePublishableKey() {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}") as Record<string, string>;
    return keys.default;
  } catch {
    return undefined;
  }
}

function getAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = getSupabaseSecretKey();
  if (!url || !key) throw new Error("Supabase function secrets are not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = Deno.env.get("SUPABASE_URL");
  const key = getSupabasePublishableKey();
  if (!token || !url || !key) return null;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  return error || !data.user ? null : data.user;
}

async function readBody(request: Request) {
  if (!request.body) throw new Error("Missing request body.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBodyBytes) {
        await reader.cancel();
        throw new Error("Request body too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function decodeHex(hex: string) {
  if (!/^[a-f0-9]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index++) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}

async function hmacHex(secret: string, message: string | Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, typeof message === "string" ? new TextEncoder().encode(message) : message));
  return [...signature].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function equalHex(expectedHex: string, receivedHex: string) {
  const expected = decodeHex(expectedHex);
  const received = decodeHex(receivedHex);
  if (!expected || !received || expected.length !== received.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index++) diff |= expected[index] ^ received[index];
  return diff === 0;
}

async function razorpayFetch<T>(path: string, init: RequestInit = {}) {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) throw new Error("Razorpay credentials are not configured.");
  const authorization = btoa(`${keyId}:${keySecret}`);
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Razorpay rejected the API credentials. Confirm that the Test or Live Key ID and Key Secret match.");
    }
    throw new Error(`Razorpay could not create the order (HTTP ${response.status}). Check the key mode and Razorpay account.`);
  }
  return await response.json() as T;
}

async function getPaymentRecord(client: SupabaseClient, paymentId: string, userId: string) {
  const { data, error } = await client.from("payments").select("id,user_id,amount_paise,currency,status,razorpay_order_id,razorpay_payment_id,order_creation_started_at")
    .eq("id", paymentId).eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Payment records are not ready. Apply the Supabase payments migration and try again.");
  return data as PaymentRecord | null;
}

async function createOrder(client: SupabaseClient, userId: string, paymentId: string) {
  let payment = await getPaymentRecord(client, paymentId, userId);
  if (!payment) return json({ error: "Payment not found." }, 404);
  if (payment.status === "paid" || payment.status === "refunded") return json({ error: "This payment is already complete." }, 409);
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  if (!keyId) return json({ error: "Payments are not configured." }, 503);

  // Razorpay permits multiple payment attempts against one un-paid order. Reuse
  // the order after a failed method so the customer can retry with another one.
  if (payment.razorpay_order_id && ["pending", "failed"].includes(payment.status)) {
    return json({ order_id: payment.razorpay_order_id, payment_id: payment.id, amount: payment.amount_paise, currency: payment.currency, key_id: keyId });
  }
  if (!Number.isSafeInteger(payment.amount_paise) || payment.amount_paise < 100 || payment.currency !== "INR") {
    return json({ error: "The saved payment amount is invalid." }, 409);
  }

  // A conditional claim prevents concurrent requests from creating multiple provider orders.
  const claimTime = new Date().toISOString();
  const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
  const { data: claimed, error: claimError } = await client.from("payments")
    .update({ status: "pending", order_creation_started_at: claimTime })
    .eq("id", payment.id).eq("user_id", userId).in("status", ["created", "failed"])
    .is("razorpay_order_id", null)
    .or(`order_creation_started_at.is.null,order_creation_started_at.lt.${staleBefore}`)
    .select("id").maybeSingle();
  if (claimError) throw new Error("Could not reserve this payment attempt.");
  if (!claimed) {
    payment = await getPaymentRecord(client, paymentId, userId);
    if (payment?.razorpay_order_id && ["pending", "failed"].includes(payment.status)) {
      return json({ order_id: payment.razorpay_order_id, payment_id: payment.id, amount: payment.amount_paise, currency: payment.currency, key_id: keyId });
    }
    return json({ error: "A payment attempt is already being prepared. Try again shortly." }, 409);
  }

  try {
    const order = await razorpayFetch<RazorpayOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({ amount: payment.amount_paise, currency: "INR", receipt: payment.id.replaceAll("-", "").slice(0, 40) }),
    });
    if (!order.id?.startsWith("order_") || order.amount !== payment.amount_paise || order.currency !== "INR") {
      throw new Error("Razorpay returned an invalid order.");
    }
    const { error: saveError } = await client.from("payments").update({ razorpay_order_id: order.id, order_creation_started_at: null })
      .eq("id", payment.id).eq("user_id", userId).eq("order_creation_started_at", claimTime);
    if (saveError) throw new Error("Could not save the provider order.");
    return json({ order_id: order.id, payment_id: payment.id, amount: order.amount, currency: order.currency, key_id: keyId });
  } catch (error) {
    await client.from("payments").update({ status: "created", order_creation_started_at: null })
      .eq("id", payment.id).eq("user_id", userId).eq("order_creation_started_at", claimTime);
    const message = error instanceof Error && /^(Razorpay credentials are not configured\.|Razorpay rejected the API credentials\.|Razorpay could not create the order)/.test(error.message)
      ? error.message
      : "Could not reach Razorpay. Check the Edge Function secrets and try again.";
    return json({ error: message }, 502);
  }
}

async function verifyPayment(client: SupabaseClient, userId: string, body: Record<string, unknown>) {
  const paymentId = typeof body.payment_id === "string" ? body.payment_id : "";
  const providerOrderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const providerPaymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!/^[0-9a-f-]{36}$/i.test(paymentId) || !/^order_[A-Za-z0-9]+$/.test(providerOrderId) || !/^pay_[A-Za-z0-9]+$/.test(providerPaymentId)) {
    return json({ error: "Payment details are invalid." }, 400);
  }
  const payment = await getPaymentRecord(client, paymentId, userId);
  if (!payment) return json({ error: "Payment not found." }, 404);
  if (payment.razorpay_order_id !== providerOrderId) return json({ error: "Payment could not be verified." }, 400);
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keySecret) return json({ error: "Payments are not configured." }, 503);
  const expected = await hmacHex(keySecret, `${providerOrderId}|${providerPaymentId}`);
  if (!await equalHex(expected, signature)) return json({ error: "Payment could not be verified." }, 400);

  const providerPayment = await razorpayFetch<RazorpayPayment>(`/payments/${encodeURIComponent(providerPaymentId)}`);
  if (providerPayment.order_id !== providerOrderId || providerPayment.amount !== payment.amount_paise || providerPayment.currency !== "INR") {
    return json({ error: "Payment could not be verified." }, 400);
  }
  if (providerPayment.status !== "captured" || !providerPayment.captured) {
    return json({ status: "pending", message: "Payment is not captured yet." }, 202);
  }
  const { data: updated, error } = await client.from("payments").update({ status: "paid", razorpay_payment_id: providerPaymentId })
    .eq("id", payment.id).eq("user_id", userId).eq("razorpay_order_id", providerOrderId).in("status", ["created", "pending", "failed"])
    .select("id,status").maybeSingle();
  if (error) throw new Error("Could not update payment status.");
  if (!updated && payment.status !== "paid") return json({ error: "Payment status changed. Refresh and try again." }, 409);
  return json({ payment_id: payment.id, status: "paid" });
}

async function handleWebhook(request: Request, client: SupabaseClient, rawBody: Uint8Array) {
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const eventId = request.headers.get("x-razorpay-event-id") ?? "";
  if (!secret || !eventId || eventId.length > 200) return json({ error: "Webhook is not configured." }, 503);
  const expected = await hmacHex(secret, rawBody);
  if (!await equalHex(expected, signature)) return json({ error: "Invalid webhook signature." }, 400);

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(new TextDecoder().decode(rawBody)) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid webhook body." }, 400);
  }
  if (typeof event.event !== "string") return json({ error: "Invalid webhook event." }, 400);
  const payloadHash = await hmacHex(secret, rawBody);
  const { error: logError } = await client.from("payment_webhook_events").upsert({
    event_id: eventId,
    event_type: event.event,
    payload_hash: payloadHash,
    processing_status: "received",
    received_at: new Date().toISOString(),
  }, { onConflict: "event_id", ignoreDuplicates: true });
  if (logError) return json({ error: "Webhook could not be recorded." }, 503);

  const entity = (event.event === "payment.captured" ? (event.payload as Record<string, { entity?: RazorpayPayment }> | undefined)?.payment?.entity
    : event.event === "payment.failed" ? (event.payload as Record<string, { entity?: RazorpayPayment }> | undefined)?.payment?.entity
    : event.event === "order.paid" ? (event.payload as Record<string, { entity?: RazorpayPayment }> | undefined)?.payment?.entity
    : undefined);
  if (entity?.order_id && entity.id && entity.currency === "INR" && Number.isSafeInteger(entity.amount)) {
    const isCaptured = event.event === "payment.captured" || event.event === "order.paid";
    const { data: payment, error: lookupError } = await client.from("payments").select("id,amount_paise,status")
      .eq("razorpay_order_id", entity.order_id).maybeSingle();
    if (lookupError) return json({ error: "Webhook could not be processed." }, 503);
    if (payment && payment.amount_paise === entity.amount) {
      const nextStatus = isCaptured && entity.captured ? "paid" : "failed";
      const { error: updateError } = await client.from("payments").update({ status: nextStatus, razorpay_payment_id: entity.id })
        .eq("id", payment.id).eq("razorpay_order_id", entity.order_id).in("status", ["created", "pending", "failed"]);
      if (updateError) return json({ error: "Webhook could not be processed." }, 503);
    }
  }
  const { error: completeError } = await client.from("payment_webhook_events").update({ processing_status: "processed", processed_at: new Date().toISOString() }).eq("event_id", eventId);
  if (completeError) return json({ error: "Webhook could not be recorded." }, 503);
  return json({ received: true });
}

Deno.serve(async (request) => {
  const origin = getCorsOrigin(request);
  const withCors = (response: Response) => {
    if (origin) response.headers.set("Access-Control-Allow-Origin", origin);
    return response;
  };
  if (request.method === "OPTIONS") return origin ? new Response("ok", { headers: { ...corsHeaders, "Access-Control-Allow-Origin": origin } }) : new Response(null, { status: 403 });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, origin ?? undefined);

  const isWebhook = request.headers.has("x-razorpay-signature");
  if (!isWebhook && origin === undefined) return json({ error: "This origin is not allowed." }, 403);
  if (!isWebhook && !request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json({ error: "Send JSON." }, 415, origin ?? undefined);
  }

  let rawBody: Uint8Array;
  try {
    rawBody = await readBody(request);
  } catch {
    return json({ error: "Request body is missing or too large." }, 413, origin ?? undefined);
  }

  try {
    const client = getAdminClient();
    if (isWebhook) return withCors(await handleWebhook(request, client, rawBody));

    const user = await authenticate(request);
    if (!user) return withCors(json({ error: "Sign in to continue." }, 401));
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(new TextDecoder().decode(rawBody)) as Record<string, unknown>;
    } catch {
      return withCors(json({ error: "Send valid JSON." }, 400));
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return withCors(json({ error: "Send valid JSON." }, 400));
    if (body.action === "create_order" && typeof body.payment_id === "string") return withCors(await createOrder(client, user.id, body.payment_id));
    if (body.action === "verify_payment") return withCors(await verifyPayment(client, user.id, body));
    return withCors(json({ error: "Unsupported payment action." }, 400));
  } catch (error) {
    // Keep credentials and provider/database response bodies out of client responses and logs.
    console.error("razorpay-payments request failed", error instanceof Error ? error.name : "UnknownError");
    const message = error instanceof Error && error.message === "Payment records are not ready. Apply the Supabase payments migration and try again."
      ? error.message
      : error instanceof Error && error.message === "Supabase function secrets are not configured."
        ? "Payment service secrets are not configured in Supabase."
        : "Payment service is temporarily unavailable. Check the Supabase function logs and try again.";
    return json({ error: message }, 503, origin ?? undefined);
  }
});
