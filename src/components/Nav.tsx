import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";

export default async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-card-border bg-card">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span aria-hidden>🥔</span>
          Chipsklubben
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-brand">
            Crisps
          </Link>
          {user ? (
            <>
              <Link href="/crisps/new" className="hover:text-brand">
                Add a crisp
              </Link>
              <Link href="/invites" className="hover:text-brand">
                Invite
              </Link>
              <span className="text-muted hidden sm:inline">{user.name}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-card-border px-3 py-1.5 hover:bg-brand-soft"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand text-brand-foreground px-3 py-1.5 font-medium hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
