"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  CrispImageError,
  deleteCrispImage,
  uploadCrispImage,
  uploadCrispImageFromUrl,
} from "@/lib/crisp-image";
import { isCountry, matchCountry } from "@/lib/countries";
import { lookupBarcode } from "@/lib/open-food-facts";
import { MAX_PHOTOS_PER_CRISP } from "@/lib/photo-limits";
import type { ActionState } from "@/lib/actions/auth";

function getOptionalImage(formData: FormData): File | null {
  const file = formData.get("image");
  return file instanceof File && file.size > 0 ? file : null;
}

// Validates case-insensitively (so a pre-existing "sweden" still passes)
// but always normalizes to the canonical casing, so whatever gets saved
// exactly matches a COUNTRIES entry — never a stray value a <select>
// would silently fail to show as selected.
const countryField = z
  .string()
  .trim()
  .refine(isCountry, "Choose a country from the list")
  .transform((value) => matchCountry(value)!);

const crispSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().trim().min(1, "Brand is required").max(120),
  country: countryField,
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

  const image = getOptionalImage(formData);
  const scannedImageUrlRaw = formData.get("scannedImageUrl");
  const scannedImageUrl =
    typeof scannedImageUrlRaw === "string" && scannedImageUrlRaw ? scannedImageUrlRaw : null;

  let imageUrl: string | undefined;
  try {
    if (image) {
      imageUrl = await uploadCrispImage(image);
    } else if (scannedImageUrl) {
      imageUrl = await uploadCrispImageFromUrl(scannedImageUrl);
    }
  } catch (error) {
    if (error instanceof CrispImageError) {
      return { error: error.message };
    }
    throw error;
  }

  let crisp;
  try {
    crisp = await prisma.crisp.create({
      data: {
        name,
        brand,
        country,
        createdById: user.id,
        photos: imageUrl ? { create: { url: imageUrl } } : undefined,
        reviews: {
          create: {
            userId: user.id,
            rating,
            tastingNotes,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to create crisp:", error);
    if (imageUrl) {
      await deleteCrispImage(imageUrl);
    }
    return { error: "Kunde inte spara chipsen. Försök igen." };
  }

  revalidatePath("/");
  redirect(`/crisps/${crisp.id}`);
}

export async function addCrispPhotoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to add a photo" };
  }

  const crispId = formData.get("crispId");
  if (typeof crispId !== "string" || !crispId) {
    return { error: "Invalid crisp" };
  }

  const image = getOptionalImage(formData);
  if (!image) {
    return { error: "Choose an image first" };
  }

  const crisp = await prisma.crisp.findUnique({
    where: { id: crispId },
    select: { _count: { select: { photos: true } } },
  });
  if (!crisp) {
    return { error: "That crisp no longer exists" };
  }
  if (crisp._count.photos >= MAX_PHOTOS_PER_CRISP) {
    return { error: `A crisp can have at most ${MAX_PHOTOS_PER_CRISP} photos` };
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadCrispImage(image);
  } catch (error) {
    if (error instanceof CrispImageError) {
      return { error: error.message };
    }
    throw error;
  }

  try {
    await prisma.crispPhoto.create({ data: { crispId, url: imageUrl } });
  } catch (error) {
    console.error("Failed to save crisp photo:", error);
    await deleteCrispImage(imageUrl);
    return { error: "Bilden laddades upp men kunde inte sparas. Försök igen." };
  }

  revalidatePath(`/crisps/${crispId}`);
  revalidatePath("/");
  return {};
}

export async function deleteCrispPhotoAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to remove a photo" };
  }

  const photoId = formData.get("photoId");
  if (typeof photoId !== "string" || !photoId) {
    return { error: "Invalid photo" };
  }

  const photo = await prisma.crispPhoto.findUnique({ where: { id: photoId } });
  if (!photo) {
    return {};
  }

  await prisma.crispPhoto.delete({ where: { id: photoId } });
  await deleteCrispImage(photo.url);

  revalidatePath(`/crisps/${photo.crispId}`);
  revalidatePath("/");
  return {};
}

const editCrispSchema = z.object({
  crispId: z.string().min(1),
  name: z.string().trim().min(1, "Name is required").max(120),
  brand: z.string().trim().min(1, "Brand is required").max(120),
  country: countryField,
});

export async function updateCrispAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to edit a crisp" };
  }

  const parsed = editCrispSchema.safeParse({
    crispId: formData.get("crispId"),
    name: formData.get("name"),
    brand: formData.get("brand"),
    country: formData.get("country"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { crispId, name, brand, country } = parsed.data;

  const conflict = await prisma.crisp.findUnique({
    where: { name_brand: { name, brand } },
  });
  if (conflict && conflict.id !== crispId) {
    return { error: "Another crisp already has that name and brand" };
  }

  try {
    await prisma.crisp.update({ where: { id: crispId }, data: { name, brand, country } });
  } catch (error) {
    console.error("Failed to update crisp:", error);
    return { error: "Could not save changes. Try again." };
  }

  revalidatePath(`/crisps/${crispId}`);
  revalidatePath("/");
  return {};
}

export type BarcodeUpdateState = { error?: string; message?: string } | undefined;

/** Looks a barcode up on Open Food Facts and overwrites an existing crisp's
 * name, brand and country with what it finds, adding its product photo too
 * if the crisp has room for one. */
export async function updateCrispFromBarcodeAction(
  crispId: string,
  barcode: string
): Promise<BarcodeUpdateState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in to edit a crisp" };
  }

  const crisp = await prisma.crisp.findUnique({
    where: { id: crispId },
    include: { _count: { select: { photos: true } } },
  });
  if (!crisp) {
    return { error: "That crisp no longer exists" };
  }

  const result = await lookupBarcode(barcode);
  if (!result.found) {
    return { error: result.error };
  }

  const name = result.name.slice(0, 120) || crisp.name;
  const brand = result.brand.slice(0, 120) || crisp.brand;
  const country = result.country || crisp.country;

  const conflict = await prisma.crisp.findUnique({
    where: { name_brand: { name, brand } },
  });
  if (conflict && conflict.id !== crispId) {
    return {
      error: `"${name}" by ${brand} is already in the listing as another crisp`,
    };
  }

  await prisma.crisp.update({ where: { id: crispId }, data: { name, brand, country } });

  const notes: string[] = [];
  if (!result.country) {
    notes.push("the country wasn't recognized, so it was left as it was");
  }
  if (result.previewImageUrl) {
    if (crisp._count.photos >= MAX_PHOTOS_PER_CRISP) {
      notes.push(`the product photo wasn't added — this crisp already has ${MAX_PHOTOS_PER_CRISP} photos`);
    } else {
      let url: string | null = null;
      try {
        url = await uploadCrispImageFromUrl(result.previewImageUrl);
        await prisma.crispPhoto.create({ data: { crispId, url } });
        notes.push("the product photo was added");
      } catch (error) {
        if (!(error instanceof CrispImageError)) {
          console.error("Failed to add product photo:", error);
          if (url) await deleteCrispImage(url);
        }
        notes.push("the product photo couldn't be added");
      }
    }
  } else {
    notes.push("Open Food Facts has no photo of it");
  }

  revalidatePath(`/crisps/${crispId}`);
  revalidatePath("/");
  return {
    message: `Updated from Open Food Facts${notes.length ? ` — ${notes.join("; ")}` : ""}.`,
  };
}

export async function deleteCrispAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return;
  }

  const crispId = formData.get("crispId");
  if (typeof crispId !== "string" || !crispId) {
    return;
  }

  const crisp = await prisma.crisp.findUnique({
    where: { id: crispId },
    include: { photos: { select: { url: true } } },
  });
  if (!crisp) {
    redirect("/");
  }

  await prisma.crisp.delete({ where: { id: crispId } });

  await Promise.all(crisp.photos.map((photo) => deleteCrispImage(photo.url)));

  revalidatePath("/");
  redirect("/");
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
