import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const inputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("food_order"), items: z.array(z.object({ menuItemId: z.string().uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(30), customerName: z.string().trim().min(2).max(160), customerPhone: z.string().trim().min(7).max(40) }),
  z.object({ kind: z.literal("event_registration"), ticketTypeId: z.string().uuid(), attendeeName: z.string().trim().min(2).max(160), attendeeEmail: z.string().trim().email().max(320), attendeePhone: z.string().trim().min(7).max(40) }),
]);

function errorResponse(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  return NextResponse.json({ error: "Could not prepare checkout. Please try again." }, { status: 503 });
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) return NextResponse.json({ error: "Refresh checkout and try again." }, { status: 400 });
    let requestData: unknown;
    try { requestData = await request.json(); } catch { return NextResponse.json({ error: "Send valid checkout details." }, { status: 400 }); }
    const body = inputSchema.safeParse(requestData);
    if (!body.success) return NextResponse.json({ error: "Check the checkout details and try again." }, { status: 400 });
    const requestHash = createHash("sha256").update(JSON.stringify(body.data)).digest("hex");
    const prisma = getPrisma();
    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.payment.findUnique({ where: { userId_idempotencyKey: { userId: user.id, idempotencyKey } }, select: { id: true, amountPaise: true, requestHash: true } });
      if (previous) {
        if (previous.requestHash !== requestHash) throw new ApiError(409, "CHECKOUT_CHANGED", "Your cart changed. Start checkout again.");
        return { paymentId: previous.id, amountPaise: previous.amountPaise, title: "Collexus checkout", item: "Purchase" };
      }
      if (body.data.kind === "event_registration") {
        const ticket = await tx.eventTicketType.findFirst({
          where: {
            id: body.data.ticketTypeId, isActive: true, pricePaise: { gte: 100 },
            AND: [
              { OR: [{ salesStartAt: null }, { salesStartAt: { lte: new Date() } }] },
              { OR: [{ salesEndAt: null }, { salesEndAt: { gt: new Date() } }] },
            ],
          },
        });
        if (!ticket) throw new ApiError(409, "TICKET_UNAVAILABLE", "This ticket is no longer available.");
        if (ticket.capacity !== null) {
          const sold = await tx.eventRegistration.count({ where: { ticketTypeId: ticket.id, OR: [
            { status: "confirmed" },
            { status: "pending_payment", createdAt: { gt: new Date(Date.now() - 15 * 60_000) } },
          ] } });
          if (sold >= ticket.capacity) throw new ApiError(409, "TICKET_SOLD_OUT", "This ticket is sold out.");
        }
        const registration = await tx.eventRegistration.create({ data: {
          userId: user.id, ticketTypeId: ticket.id, eventSlug: ticket.eventSlug, eventTitle: ticket.eventTitle,
          ticketName: ticket.name, attendeeName: body.data.attendeeName, attendeeEmail: body.data.attendeeEmail,
          attendeePhone: body.data.attendeePhone, amountPaise: ticket.pricePaise,
        } });
        const payment = await tx.payment.create({ data: { userId: user.id, purchaseType: "event_registration", purchaseId: registration.id, amountPaise: ticket.pricePaise, idempotencyKey, requestHash } });
        return { paymentId: payment.id, amountPaise: payment.amountPaise, title: ticket.eventTitle, item: ticket.name };
      }

      const requested = body.data.items;
      if (new Set(requested.map((item) => item.menuItemId)).size !== requested.length) {
        throw new ApiError(400, "DUPLICATE_MENU_ITEM", "Each menu item can appear only once in the cart.");
      }
      const menuItems = await tx.foodMenuItem.findMany({
        where: { id: { in: requested.map((item) => item.menuItemId) }, isAvailable: true, stall: { status: "active" } },
        select: { id: true, name: true, pricePaise: true, stallId: true },
      });
      if (menuItems.length !== requested.length) throw new ApiError(409, "MENU_CHANGED", "One or more menu items are no longer available. Refresh the menu.");
      if (new Set(menuItems.map((item) => item.stallId)).size !== 1) throw new ApiError(400, "ONE_STALL_PER_ORDER", "Place a separate order for each stall.");
      const lines = requested.map((entry) => {
        const item = menuItems.find((candidate) => candidate.id === entry.menuItemId)!;
        const lineTotalPaise = item.pricePaise * entry.quantity;
        if (!Number.isSafeInteger(lineTotalPaise)) throw new ApiError(400, "INVALID_AMOUNT", "The order total is invalid.");
        return { menuItemId: item.id, itemName: item.name, unitPricePaise: item.pricePaise, quantity: entry.quantity, lineTotalPaise };
      });
      const amountPaise = lines.reduce((sum, line) => sum + line.lineTotalPaise, 0);
      if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) throw new ApiError(400, "INVALID_AMOUNT", "The order total must be at least ₹1.");
      const stallId = menuItems[0].stallId;
      const order = await tx.foodOrder.create({ data: {
        userId: user.id, stallId, customerName: body.data.customerName, customerPhone: body.data.customerPhone,
        subtotalPaise: amountPaise, amountPaise,
        items: { create: lines },
      }, select: { id: true } });
      const payment = await tx.payment.create({ data: { userId: user.id, purchaseType: "food_order", purchaseId: order.id, amountPaise, idempotencyKey, requestHash } });
      return { paymentId: payment.id, amountPaise, title: "Campus food order", item: `${lines.length} menu item${lines.length === 1 ? "" : "s"}` };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
