"use server";

export type BarcodeLookupResult =
  | { found: true; name: string; brand: string; country: string }
  | { found: false; error: string };

type OpenFoodFactsProduct = {
  product_name?: string;
  product_name_sv?: string;
  brands?: string;
  countries?: string;
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
  )}.json?fields=product_name,product_name_sv,brands,countries`;

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
  const country = firstOf(data.product.countries);

  if (!name && !brand) {
    return {
      found: false,
      error: "That product is missing a name/brand in Open Food Facts. Fill in the details manually instead.",
    };
  }

  return { found: true, name, brand, country };
}
