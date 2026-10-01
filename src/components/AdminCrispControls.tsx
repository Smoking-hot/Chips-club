"use client";

import { useActionState, useState } from "react";
import { updateCrispAction, deleteCrispAction } from "@/lib/actions/crisps";
import { COUNTRIES } from "@/lib/countries";
import SubmitButton from "@/components/SubmitButton";

export default function AdminCrispControls({
  crisp,
}: {
  crisp: { id: string; name: string; brand: string; country: string };
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updateState, updateAction] = useActionState(updateCrispAction, undefined);

  return (
    <section className="rounded-lg border border-card-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Admin
        </span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-sm text-brand underline"
        >
          {editing ? "Cancel" : "Edit crisp"}
        </button>
      </div>

      {editing && (
        <form action={updateAction} className="space-y-3">
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
                defaultValue={crisp.country}
                className="w-full rounded-md border border-card-border bg-card px-3 py-2"
              >
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
    </section>
  );
}
