"use client";

import { useActionState, useRef, useState } from "react";
import { createCrispAction } from "@/lib/actions/crisps";
import { lookupBarcodeAction } from "@/lib/actions/barcode";
import RatingInput from "@/components/RatingInput";
import SubmitButton from "@/components/SubmitButton";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function CrispForm() {
  const [state, formAction] = useActionState(createCrispAction, undefined);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [country, setCountry] = useState("");

  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scanStatus, setScanStatus] = useState<
    { type: "info" | "error"; message: string } | null
  >(null);
  const handledCodeRef = useRef<string | null>(null);

  async function handleDetected(code: string) {
    if (handledCodeRef.current === code) return;
    handledCodeRef.current = code;

    setScanning(false);
    setLookingUp(true);
    setScanStatus(null);

    const result = await lookupBarcodeAction(code);
    setLookingUp(false);

    if (result.found) {
      setName(result.name);
      setBrand(result.brand);
      if (result.country) setCountry(result.country);
      setScanStatus({
        type: "info",
        message: "Filled in from Open Food Facts — check it over before saving.",
      });
    } else {
      setScanStatus({ type: "error", message: result.error });
    }
  }

  function startScanning() {
    handledCodeRef.current = null;
    setScanStatus(null);
    setScanning(true);
  }

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      {scanning ? (
        <BarcodeScanner
          onDetected={handleDetected}
          onClose={() => setScanning(false)}
        />
      ) : (
        <button
          type="button"
          onClick={startScanning}
          disabled={lookingUp}
          className="w-full rounded-md border border-card-border bg-brand-soft px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {lookingUp ? "Looking up barcode…" : "📷 Scan barcode"}
        </button>
      )}

      {scanStatus && (
        <p
          className={`text-sm px-3 py-2 rounded-md ${
            scanStatus.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-brand-soft text-foreground"
          }`}
        >
          {scanStatus.message}
        </p>
      )}

      <p className="text-xs text-muted">
        Scanning fills in the fields below using{" "}
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Open Food Facts
        </a>
        , or skip it and fill them in yourself.
      </p>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Crisp name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sea Salt & Cider Vinegar"
          className="w-full rounded-md border border-card-border bg-card px-3 py-2"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium mb-1">
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            type="text"
            required
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Estrella"
            className="w-full rounded-md border border-card-border bg-card px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1">
            Country
          </label>
          <input
            id="country"
            name="country"
            type="text"
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Sweden"
            className="w-full rounded-md border border-card-border bg-card px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label htmlFor="image" className="block text-sm font-medium mb-1">
          Photo <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm"
        />
      </div>
      <div>
        <span className="block text-sm font-medium mb-1">Your rating</span>
        <RatingInput name="rating" />
      </div>
      <div>
        <label htmlFor="tastingNotes" className="block text-sm font-medium mb-1">
          Your tasting notes
        </label>
        <textarea
          id="tastingNotes"
          name="tastingNotes"
          required
          rows={4}
          placeholder="Sharp vinegar tang, good crunch, a little too salty at the bottom of the bag."
          className="w-full rounded-md border border-card-border bg-card px-3 py-2"
        />
      </div>
      <SubmitButton pendingText="Adding crisp…">Add crisp</SubmitButton>
    </form>
  );
}
