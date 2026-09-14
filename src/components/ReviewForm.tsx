"use client";

import { useActionState } from "react";
import { upsertReviewAction } from "@/lib/actions/crisps";
import RatingInput from "@/components/RatingInput";
import SubmitButton from "@/components/SubmitButton";

export default function ReviewForm({
  crispId,
  existing,
}: {
  crispId: string;
  existing?: { rating: number; tastingNotes: string } | null;
}) {
  const [state, formAction] = useActionState(upsertReviewAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="crispId" value={crispId} />
      {state?.error && (
        <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      <div>
        <span className="block text-sm font-medium mb-1">Your rating</span>
        <RatingInput name="rating" defaultValue={existing?.rating ?? 0} />
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
          defaultValue={existing?.tastingNotes}
          placeholder="Crunch, saltiness, flavour balance, anything that stood out…"
          className="w-full rounded-md border border-card-border bg-card px-3 py-2"
        />
      </div>
      <SubmitButton pendingText="Saving…">
        {existing ? "Update your review" : "Add your review"}
      </SubmitButton>
    </form>
  );
}
