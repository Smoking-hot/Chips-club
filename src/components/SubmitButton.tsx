"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-brand text-brand-foreground px-4 py-2 font-medium hover:opacity-90 disabled:opacity-60"
    >
      {pending ? (pendingText ?? "Saving…") : children}
    </button>
  );
}
