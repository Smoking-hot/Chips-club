"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  updateCrispAction,
  deleteCrispAction,
  updateCrispFromBarcodeAction,
  type BarcodeUpdateState,
} from "@/lib/actions/crisps";
import BarcodeScanner from "@/components/BarcodeScanner";
import { COUNTRIES, matchCountry } from "@/lib/countries";
import SubmitButton from "@/components/SubmitButton";

export default function CrispControls({
  crisp,
  canDelete,
}: {
  crisp: { id: string; name: string; brand: string; country: string };
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updateState, updateAction] = useActionState(updateCrispAction, undefined);

  const [scanning, setScanning] = useState(false);
  const [scanState, setScanState] = useState<BarcodeUpdateState>(undefined);
  const [lookingUp, startLookup] = useTransition();
  const handledCodeRef = useRef<string | null>(null);

  function handleDetected(code: string) {
    if (handledCodeRef.current === code) return;
    handledCodeRef.current = code;
    setScanning(false);
    startLookup(async () => {
      setScanState(await updateCrispFromBarcodeAction(crisp.id, code));
    });
  }

  // A crisp added before the country field became a dropdown can have a
  // stored value that isn't an exact (case-sensitive) match for any option
  // — e.g. "sweden". A <select> silently falls back to its first option in
  // that case, so match it case-insensitively and surface an unmatched
  // value explicitly instead of quietly defaulting to "Afghanistan".
  const matchedCountry = matchCountry(crisp.country);

  return (
    <section className="rounded-lg border border-card-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Crisp details
        </span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              handledCodeRef.current = null;
              setScanState(undefined);
              setScanning((v) => !v);
            }}
            disabled={lookingUp}
            className="text-sm text-brand underline disabled:opacity-60"
          >
            {lookingUp ? "Looking up barcode…" : scanning ? "Stop scanning" : "📷 Scan barcode"}
          </button>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-sm text-brand underline"
          >
            {editing ? "Cancel" : "Edit crisp"}
          </button>
        </div>
      </div>

      {scanning && (
        <div className="space-y-2">
          <p className="text-xs text-muted">
            Scanning overwrites the name, brand and country with what{" "}
            <a
              href="https://world.openfoodfacts.org"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Open Food Facts
            </a>{" "}
            has for the barcode, and adds its product photo.
          </p>
          <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />
        </div>
      )}

      {scanState && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            scanState.error ? "bg-red-50 text-red-700" : "bg-brand-soft text-foreground"
          }`}
        >
          {scanState.error ?? scanState.message}
        </p>
      )}

      {editing && (
        <form
          key={`${crisp.name}|${crisp.brand}|${crisp.country}`}
          action={updateAction}
          className="space-y-3"
        >
          <input type="hidden" name="crispId" value={crisp.id} />
          {updateState?.error && (
            <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
              {updateState.error}
            </p>
          )}
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              id="edit-name"
              name="name"
              type="text"
              required
              defaultValue={crisp.name}
              className="w-full rounded-md border border-card-border bg-card px-3 py-2"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-brand" className="block text-sm font-medium mb-1">
                Brand
              </label>
              <input
                id="edit-brand"
                name="brand"
                type="text"
                required
                defaultValue={crisp.brand}
                className="w-full rounded-md border border-card-border bg-card px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="edit-country" className="block text-sm font-medium mb-1">
                Country
              </label>
              <select
                id="edit-country"
                name="country"
                required
                defaultValue={matchedCountry ?? crisp.country}
                className="w-full rounded-md border border-card-border bg-card px-3 py-2"
              >
                {!matchedCountry && (
                  <option value={crisp.country}>
                    {crisp.country} (not in list — please pick one below)
                  </option>
                )}
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
        </form>
      )}

      {canDelete && (
        <div className="pt-2 border-t border-card-border">
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span>Delete this crisp and everyone&apos;s reviews on it?</span>
              <div className="flex gap-2">
                <form action={deleteCrispAction}>
                  <input type="hidden" name="crispId" value={crisp.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-red-600 text-white px-3 py-1.5 font-medium hover:bg-red-700"
                  >
                    Yes, delete
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-md border border-card-border px-3 py-1.5 hover:bg-brand-soft"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-sm text-red-700 hover:underline"
            >
              Delete crisp
            </button>
          )}
        </div>
      )}
    </section>
  );
}
