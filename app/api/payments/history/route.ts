import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    const prisma = getPrisma();
    const [registrations, orders] = await Promise.all([
      prisma.eventRegistration.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.foodOrder.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100, include: { stall: { select: { name: true } }, items: { orderBy: { createdAt: "asc" }, select: { itemName: true, quantity: true } } } }),
    ]);
    const payments = await prisma.payment.findMany({
      where: { userId: user.id, OR: [
        { purchaseType: "event_registration", purchaseId: { in: registrations.map((row) => row.id) } },
        { purchaseType: "food_order", purchaseId: { in: orders.map((row) => row.id) } },
      ] },
      select: { purchaseType: true, purchaseId: true, status: true },
    });
    const paymentByPurchase = new Map(payments.map((payment) => [`${payment.purchaseType}:${payment.purchaseId}`, payment.status]));
    return NextResponse.json({
      events: registrations.map((registration) => ({
        title: registration.eventTitle, organizer: "Event registration", date: registration.createdAt.toISOString(), category: registration.ticketName,
        image: "/assets/event-art/hackathon.webp", status: registration.status === "confirmed" ? "Registered" : registration.status === "pending_payment" ? "Ongoing" : "Closed",
        paymentStatus: paymentByPurchase.get(`event_registration:${registration.id}`) ?? "created", reference: registration.id,
      })),
      orders: orders.map((order) => ({
        title: order.items.map((item) => `${item.itemName}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ") || "Food order",
        event: order.stall.name, date: order.createdAt.toISOString(), pricePaise: order.amountPaise, status: order.status,
        paymentStatus: paymentByPurchase.get(`food_order:${order.id}`) ?? "created", reference: order.id,
      })),
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 503;
    return NextResponse.json({ error: error instanceof ApiError ? error.message : "Purchase history is temporarily unavailable." }, { status });
  }
}
