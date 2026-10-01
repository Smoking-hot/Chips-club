import "server-only";
import { put, del } from "@vercel/blob";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB — keep in sync with serverActions.bodySizeLimit in next.config.ts
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export class CrispImageError extends Error {}

async function uploadToBlob(
  filename: string,
  data: Blob | ArrayBuffer
): Promise<string> {
  try {
    const blob = await put(`crisps/${crypto.randomUUID()}-${filename}`, data, {
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

export async function uploadCrispImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new CrispImageError("Bilden måste vara JPEG, PNG, WEBP eller GIF");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new CrispImageError("Bilden får vara max 8 MB");
  }

  return uploadToBlob(file.name, file);
}

/** Downloads an image from an external URL (e.g. a product photo from Open
 * Food Facts) and re-hosts it in our own Blob storage, so the crisp listing
 * never depends on a third party's image CDN staying up. */
export async function uploadCrispImageFromUrl(sourceUrl: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(sourceUrl, { signal: AbortSignal.timeout(10000) });
  } catch {
    throw new CrispImageError("Kunde inte hämta produktbilden.");
  }

  if (!response.ok) {
    throw new CrispImageError("Kunde inte hämta produktbilden.");
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim();
  if (!contentType || !ALLOWED_TYPES.has(contentType)) {
    throw new CrispImageError("Produktbilden hade ett format vi inte stödjer.");
  }

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_FILE_SIZE) {
    throw new CrispImageError("Produktbilden var för stor.");
  }

  const extension = contentType.split("/")[1] ?? "jpg";
  return uploadToBlob(`product.${extension}`, bytes);
}

export async function deleteCrispImage(url: string) {
  try {
    await del(url);
  } catch {
    // Best-effort cleanup — an orphaned blob isn't worth failing the request over.
  }
}
