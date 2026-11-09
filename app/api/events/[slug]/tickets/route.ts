import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return NextResponse.json({ tickets: [] });
  const now = new Date();
  try {
    const tickets = await getPrisma().eventTicketType.findMany({
      where: {
        eventSlug: slug,
        isActive: true,
        pricePaise: { gte: 100 },
        AND: [
          { OR: [{ salesStartAt: null }, { salesStartAt: { lte: now } }] },
          { OR: [{ salesEndAt: null }, { salesEndAt: { gt: now } }] },
        ],
      },
      select: { id: true, eventTitle: true, name: true, description: true, pricePaise: true },
      orderBy: { pricePaise: "asc" },
    });
    return NextResponse.json({ tickets });
  } catch {
    return NextResponse.json({ tickets: [], error: "Ticket checkout is unavailable until the payments database migration is applied." }, { status: 503 });
  }
}
