"use server";

import { lookupBarcode, type BarcodeLookupResult } from "@/lib/open-food-facts";

export async function lookupBarcodeAction(
  barcode: string
): Promise<BarcodeLookupResult> {
  return lookupBarcode(barcode);
}
