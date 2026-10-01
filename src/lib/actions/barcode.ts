"use server";

import { matchCountry } from "@/lib/countries";

export type BarcodeLookupResult =
  | {
      found: true;
      name: string;
      brand: string;
      country: string;
      /** Open Food Facts' own image URL — only for previewing before save;
       * the crisp form re-hosts it in our own storage on submit. */
      previewImageUrl: string | null;
    }
  | { found: false; error: string };

type OpenFoodFactsProduct = {
  product_name?: string;
  product_name_sv?: string;
  brands?: string;
  countries?: string;
  image_front_url?: string;
  image_url?: string;
};

type OpenFoodFactsResponse = {
  status: number;
  product?: OpenFoodFactsProduct;
};

function firstOf(commaSeparated: string | undefined): string {
  if (!commaSeparated) return "";
  return commaSeparated.split(",")[0]?.trim() ?? "";
}

export async function lookupBarcodeAction(
  barcode: string
): Promise<BarcodeLookupResult> {
  const code = barcode.trim();
  if (!/^\d{6,14}$/.test(code)) {
    return { found: false, error: "That doesn't look like a valid barcode" };
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    code
  )}.json?fields=product_name,product_name_sv,brands,countries,image_front_url,image_url`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Chipsklubben/1.0 (+https://chips-club.vercel.app)",
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return {
      found: false,
      error: "Couldn't reach Open Food Facts right now. Fill in the details manually instead.",
    };
  }

  if (!response.ok) {
    return {
      found: false,
      error: "Couldn't reach Open Food Facts right now. Fill in the details manually instead.",
    };
  }

  const data = (await response.json()) as OpenFoodFactsResponse;

  if (data.status !== 1 || !data.product) {
    return {
      found: false,
      error: "No product found for that barcode. Fill in the details manually instead.",
    };
  }

  const name = data.product.product_name_sv || data.product.product_name || "";
  const brand = firstOf(data.product.brands);
  const rawCountry = firstOf(data.product.countries);
  const country = matchCountry(rawCountry) ?? "";
  const previewImageUrl =
    data.product.image_front_url || data.product.image_url || null;

  if (!name && !brand) {
    return {
      found: false,
      error: "That product is missing a name/brand in Open Food Facts. Fill in the details manually instead.",
    };
  }

  return { found: true, name, brand, country, previewImageUrl };
}
