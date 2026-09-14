"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { generateInviteCode } from "@/lib/invite-code";

export async function createInviteAction() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be signed in to create an invite");
  }

  let code = generateInviteCode();
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateInviteCode();
  }

  await prisma.inviteCode.create({
    data: { code, createdById: user.id },
  });

  revalidatePath("/invites");
}
