import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/backend/errors";
import { getServerEnv } from "@/lib/env";

const razorpayApi = "https://api.razorpay.com/v1";
const requestTimeoutMs = 15_000;

type RazorpayConfig = { keyId: string; keySecret: string };

export type RazorpayOrder = {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
};

export type RazorpayPayment = {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  order_id: string | null;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  captured: boolean;
};

function getRazorpayConfig(): RazorpayConfig {
  const { RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } = getServerEnv();
  if (!keyId || !keySecret) {
    throw new ApiError(503, "PAYMENTS_NOT_CONFIGURED", "Online payments are not available yet.");
  }
  return { keyId, keySecret };
}

function basicAuth({ keyId, keySecret }: RazorpayConfig) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64")}`;
}

async function razorpayRequest<T>(path: string, init: RequestInit, config = getRazorpayConfig()): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${razorpayApi}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: {
        Authorization: basicAuth(config),
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(502, "PAYMENT_PROVIDER_UNAVAILABLE", "The payment provider could not be reached. Try again.");
  }

  if (!response.ok) {
    // Do not return provider response bodies; they can contain account or request details.
    throw new ApiError(502, "PAYMENT_PROVIDER_ERROR", "The payment provider could not complete the request.");
  }
  return response.json() as Promise<T>;
}

/** Call only with an amount calculated from a trusted server-side purchase record. */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise < 100) {
    throw new ApiError(400, "INVALID_PAYMENT_AMOUNT", "The payment amount is invalid.");
  }
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(input.receipt)) {
    throw new ApiError(400, "INVALID_PAYMENT_RECEIPT", "The payment reference is invalid.");
  }

  const config = getRazorpayConfig();
  const order = await razorpayRequest<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      ...(input.notes ? { notes: input.notes } : {}),
    }),
  }, config);

  if (order.amount !== input.amountPaise || order.currency !== "INR" || !order.id.startsWith("order_")) {
    throw new ApiError(502, "INVALID_PROVIDER_RESPONSE", "The payment provider returned an invalid order.");
  }
  return { order, keyId: config.keyId };
}

export async function fetchRazorpayPayment(paymentId: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
    throw new ApiError(400, "INVALID_PAYMENT_REFERENCE", "The payment reference is invalid.");
  }
  return razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
}

export function verifyRazorpayCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const { RAZORPAY_KEY_SECRET: keySecret } = getServerEnv();
  if (!keySecret || !/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`, "utf8").digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/** Verify the exact request bytes before parsing a Razorpay webhook body. */
export function verifyRazorpayWebhookSignature(rawBody: Uint8Array, signature: string) {
  const { RAZORPAY_WEBHOOK_SECRET: webhookSecret } = getServerEnv();
  if (!webhookSecret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
