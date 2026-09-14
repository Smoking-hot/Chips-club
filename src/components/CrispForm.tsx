"use client";

import { useActionState } from "react";
import { createCrispAction } from "@/lib/actions/crisps";
import RatingInput from "@/components/RatingInput";
import SubmitButton from "@/components/SubmitButton";

export default function CrispForm() {
  const [state, formAction] = useActionState(createCrispAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Crisp name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
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
            placeholder="Sweden"
            className="w-full rounded-md border border-card-border bg-card px-3 py-2"
          />
        </div>
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
