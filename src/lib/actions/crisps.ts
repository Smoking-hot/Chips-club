"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { ActionState } from "@/lib/actions/auth";

const crispSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().trim().min(1, "Brand is required").max(120),
  country: z.string().trim().min(1, "Country is required").max(80),
  rating: z.coerce.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  tastingNotes: z.string().trim().min(1, "Tasting notes are required").max(2000),
});

export async function createCrispAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to add a crisp" };
  }

  const parsed = crispSchema.safeParse({
    name: formData.get("name"),
    brand: formData.get("brand"),
    country: formData.get("country"),
    rating: formData.get("rating"),
    tastingNotes: formData.get("tastingNotes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, brand, country, rating, tastingNotes } = parsed.data;

  const existing = await prisma.crisp.findUnique({
    where: { name_brand: { name, brand } },
  });
  if (existing) {
    return { error: "That crisp is already in the listing — add your own review to it instead" };
  }

  const crisp = await prisma.crisp.create({
    data: {
      name,
      brand,
      country,
      createdById: user.id,
      reviews: {
        create: {
          userId: user.id,
          rating,
          tastingNotes,
        },
      },
    },
  });

  revalidatePath("/");
  redirect(`/crisps/${crisp.id}`);
}

const reviewSchema = z.object({
  crispId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  tastingNotes: z.string().trim().min(1, "Tasting notes are required").max(2000),
});

export async function upsertReviewAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to add a review" };
  }

  const parsed = reviewSchema.safeParse({
    crispId: formData.get("crispId"),
    rating: formData.get("rating"),
    tastingNotes: formData.get("tastingNotes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { crispId, rating, tastingNotes } = parsed.data;

  const crisp = await prisma.crisp.findUnique({ where: { id: crispId } });
  if (!crisp) {
    return { error: "That crisp no longer exists" };
  }

  await prisma.review.upsert({
    where: { crispId_userId: { crispId, userId: user.id } },
    create: { crispId, userId: user.id, rating, tastingNotes },
    update: { rating, tastingNotes },
  });

  revalidatePath(`/crisps/${crispId}`);
  revalidatePath("/");
  return {};
}
