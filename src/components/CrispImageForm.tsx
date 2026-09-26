"use client";

import { useActionState } from "react";
import { setCrispImageAction } from "@/lib/actions/crisps";
import SubmitButton from "@/components/SubmitButton";

export default function CrispImageForm({
  crispId,
  hasImage,
}: {
  crispId: string;
  hasImage: boolean;
}) {
  const [state, formAction] = useActionState(setCrispImageAction, undefined);

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-2 text-sm"
    >
      <input type="hidden" name="crispId" value={crispId} />
      <input
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        required
        className="text-xs file:mr-2 file:rounded-md file:border-0 file:bg-brand-soft file:px-2 file:py-1 file:text-xs"
      />
      <SubmitButton pendingText="Laddar upp…">
        {hasImage ? "Byt bild" : "Lägg till bild"}
      </SubmitButton>
      {state?.error && <p className="w-full text-red-700">{state.error}</p>}
    </form>
  );
}
