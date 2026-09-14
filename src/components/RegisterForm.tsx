"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";
import SubmitButton from "@/components/SubmitButton";

export default function RegisterForm({
  inviteCode,
}: {
  inviteCode?: string;
}) {
  const [state, formAction] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border border-card-border bg-card px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-card-border bg-card px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-card-border bg-card px-3 py-2"
        />
        <p className="text-xs text-muted mt-1">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="inviteCode" className="block text-sm font-medium mb-1">
          Invite code
        </label>
        <input
          id="inviteCode"
          name="inviteCode"
          type="text"
          required
          defaultValue={inviteCode}
          placeholder="ABCD-EFGH"
          className="w-full rounded-md border border-card-border bg-card px-3 py-2 uppercase"
        />
        <p className="text-xs text-muted mt-1">
          Ask a member of Chipsklubben for an invite code.
        </p>
      </div>
      <SubmitButton pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
