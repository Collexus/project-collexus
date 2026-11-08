import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const addOnPrices: Record<string, number> = {
  "homepage-panel": 999,
  "qr-pass": 549,
  "peak-hour-reminders": 449,
  "feedback-report": 549,
};
const stallPrices: Record<string, number> = { "Silver stall": 1000, "Gold stall": 1500, "Platinum stall": 2000 };
const inputSchema = z.object({
  listingName: z.string().trim().min(2).max(160),
  stallType: z.enum(["Silver stall", "Gold stall", "Platinum stall"]),
  plan: z.enum(["normal", "pro"]),
  addOns: z.array(z.enum(["homepage-panel", "qr-pass", "peak-hour-reminders", "feedback-report"])).max(4),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
      return NextResponse.json({ error: "Refresh checkout and try again." }, { status: 400 });
    }
    let data: unknown;
    try { data = await request.json(); } catch { return NextResponse.json({ error: "Send valid checkout details." }, { status: 400 }); }
    const parsed = inputSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: "Check your stall, plan, and add-ons." }, { status: 400 });
    if (new Set(parsed.data.addOns).size !== parsed.data.addOns.length) {
      return NextResponse.json({ error: "Check your stall, plan, and add-ons." }, { status: 400 });
    }
    const input = parsed.data;
    const amountPaise = (stallPrices[input.stallType] + (input.plan === "pro" ? 500 : 0)
      + input.addOns.reduce((sum, id) => sum + addOnPrices[id], 0)) * 100;
    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) return NextResponse.json({ error: "Invalid order total." }, { status: 400 });
    const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const prisma = getPrisma();
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } } });
      if (existing) {
        if (existing.requestHash !== requestHash) throw new ApiError(409, "CHECKOUT_CHANGED", "Your order changed. Start checkout again.");
        return { id: existing.id, amountPaise: existing.amountPaise };
      }
      const order = await tx.hostStallOrder.create({ data: {
        userId: user.id, listingName: input.listingName, stallType: input.stallType, plan: input.plan,
        addOns: input.addOns, amountPaise,
      }, select: { id: true } });
      const created = await tx.payment.create({ data: {
        userId: user.id, purchaseType: "host_stall", purchaseId: order.id, amountPaise,
        idempotencyKey, requestHash,
      }, select: { id: true, amountPaise: true } });
      return created;
    });
    return NextResponse.json({ paymentId: payment.id, amountPaise: payment.amountPaise }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Could not prepare checkout. Please try again." }, { status: 503 });
  }
}
