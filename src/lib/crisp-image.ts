import "server-only";
import { put, del } from "@vercel/blob";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export class CrispImageError extends Error {}

export async function uploadCrispImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new CrispImageError("Bilden måste vara JPEG, PNG, WEBP eller GIF");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new CrispImageError("Bilden får vara max 4 MB");
  }

  try {
    const blob = await put(`crisps/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  } catch {
    throw new CrispImageError(
      "Bilduppladdning är inte konfigurerad än — koppla en Blob-lagring i Vercel (Storage → Create Database → Blob)."
    );
  }
}

export async function deleteCrispImage(url: string) {
  try {
    await del(url);
  } catch {
    // Best-effort cleanup — an orphaned blob isn't worth failing the request over.
  }
}
