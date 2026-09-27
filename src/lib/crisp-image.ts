import "server-only";
import { put, del } from "@vercel/blob";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB — keep in sync with serverActions.bodySizeLimit in next.config.ts
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export class CrispImageError extends Error {}

export async function uploadCrispImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new CrispImageError("Bilden måste vara JPEG, PNG, WEBP eller GIF");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new CrispImageError("Bilden får vara max 8 MB");
  }

  try {
    const blob = await put(`crisps/${crypto.randomUUID()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  } catch (error) {
    if (
      error instanceof Error &&
      /no.*token|blob_read_write_token/i.test(error.message)
    ) {
      throw new CrispImageError(
        "Bilduppladdning är inte konfigurerad än — koppla en Blob-lagring i Vercel (Storage → Create Database → Blob)."
      );
    }
    console.error("Crisp image upload failed:", error);
    throw new CrispImageError(
      "Bilduppladdningen misslyckades. Försök igen om en liten stund."
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
