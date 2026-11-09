"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/lib/generated/prisma/client";
import { ApiError } from "@/lib/backend/errors";
import { adminFoodMenuItemAvailabilitySchema, adminFoodMenuItemCreateSchema } from "@/lib/admin/schemas";
import { getPrisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

class StallPanelActionError extends Error {
  constructor(readonly code: string) { super(code); }
}

async function requireOperator() {
  try {
    return await requireRole("stall_operator");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(`/login/?next=${encodeURIComponent("/stall-panel/")}`);
    if (error instanceof ApiError && error.status === 403) redirect("/?panel=stall-access-required");
    throw error;
  }
}

export async function addStallMenuItem(formData: FormData) {
  const parsed = adminFoodMenuItemCreateSchema.safeParse({
    stallId: formData.get("stallId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    priceRupees: formData.get("priceRupees"),
  });
  if (!parsed.success) redirect("/stall-panel/?error=invalid-menu-item");
  const { user } = await requireOperator();

  try {
    await getPrisma().$transaction(async (transaction) => {
      const role = await transaction.userRoleAssignment.findFirst({
        where: { userId: user.id, role: "stall_operator", revokedAt: null },
        select: { id: true },
      });
      const assignment = await transaction.foodStallOperatorAssignment.findFirst({
        where: { userId: user.id, stallId: parsed.data.stallId, revokedAt: null },
        select: { stallId: true },
      });
      if (!role || !assignment) throw new StallPanelActionError("stall-assignment-required");
      const item = await transaction.foodMenuItem.create({
        data: {
          stallId: assignment.stallId,
          name: parsed.data.name,
          description: parsed.data.description || null,
          pricePaise: parsed.data.priceRupees,
        },
        select: { id: true, name: true, pricePaise: true },
      });
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "food_menu_item.create",
          resourceType: "food_menu_item",
          resourceId: item.id,
          previousValues: Prisma.DbNull,
          newValues: { stallId: assignment.stallId, name: item.name, pricePaise: item.pricePaise },
        },
      });
    });
  } catch (error) {
    if (error instanceof StallPanelActionError) redirect(`/stall-panel/?error=${error.code}`);
    console.error(JSON.stringify({ level: "error", message: "Stall operator could not add a menu item", actorId: user.id, errorName: error instanceof Error ? error.name : "UnknownError" }));
    redirect("/stall-panel/?error=save-failed");
  }

  revalidatePath("/stall-panel/");
  redirect("/stall-panel/?notice=menu-item-added");
}

export async function changeOwnMenuItemAvailability(formData: FormData) {
  const parsed = adminFoodMenuItemAvailabilitySchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    operation: formData.get("operation"),
  });
  if (!parsed.success) redirect("/stall-panel/?error=invalid-menu-item");
  const { user } = await requireOperator();

  try {
    await getPrisma().$transaction(async (transaction) => {
      const role = await transaction.userRoleAssignment.findFirst({
        where: { userId: user.id, role: "stall_operator", revokedAt: null },
        select: { id: true },
      });
      const item = await transaction.foodMenuItem.findFirst({
        where: {
          id: parsed.data.menuItemId,
          stall: { operators: { some: { userId: user.id, revokedAt: null } } },
        },
        select: { id: true, stallId: true, isAvailable: true },
      });
      if (!role || !item) throw new StallPanelActionError("stall-assignment-required");
      const isAvailable = parsed.data.operation === "enable";
      await transaction.foodMenuItem.update({ where: { id: item.id }, data: { isAvailable } });
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: `food_menu_item.${parsed.data.operation}`,
          resourceType: "food_menu_item",
          resourceId: item.id,
          previousValues: { isAvailable: item.isAvailable },
          newValues: { isAvailable, stallId: item.stallId },
        },
      });
    });
  } catch (error) {
    if (error instanceof StallPanelActionError) redirect(`/stall-panel/?error=${error.code}`);
    console.error(JSON.stringify({ level: "error", message: "Stall operator could not update menu availability", actorId: user.id, errorName: error instanceof Error ? error.name : "UnknownError" }));
    redirect("/stall-panel/?error=save-failed");
  }

  revalidatePath("/stall-panel/");
  redirect("/stall-panel/?notice=availability-updated");
}
