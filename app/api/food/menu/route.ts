import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stalls = await getPrisma().foodStall.findMany({
      where: { status: "active", menuItems: { some: { isAvailable: true, pricePaise: { gte: 100 } } } },
      select: {
        id: true, name: true, slug: true, location: true,
        menuItems: { where: { isAvailable: true, pricePaise: { gte: 100 } }, orderBy: { name: "asc" }, select: { id: true, name: true, description: true, pricePaise: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ stalls });
  } catch {
    return NextResponse.json({ error: "The live food menu is unavailable until the checkout database migration is applied." }, { status: 503 });
  }
}
