import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createInviteAction } from "@/lib/actions/invites";

export default async function InvitesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const invites = await prisma.inviteCode.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invite a friend</h1>
        <p className="text-muted text-sm mt-1">
          Generate a one-time code and share it with someone you want in
          Chipsklubben. Once they sign up with it, they can add crisps and
          reviews just like you.
        </p>
      </div>

      <form action={createInviteAction}>
        <button
          type="submit"
          className="rounded-md bg-brand text-brand-foreground px-4 py-2 font-medium hover:opacity-90"
        >
          Generate invite code
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold text-sm">Your invites</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted">
            You haven&apos;t created any invite codes yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="rounded-lg border border-card-border bg-card p-3 flex items-center justify-between gap-3"
              >
                <code className="font-mono text-sm">{invite.code}</code>
                {invite.usedAt ? (
                  <span className="text-xs text-muted">
                    Used by {invite.usedByEmail}
                  </span>
                ) : (
                  <span className="text-xs text-green-700">Unused</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
