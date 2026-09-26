import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import NavLinks from "@/components/NavLinks";

export default async function Nav() {
  const user = await getCurrentUser();

  return (
    <header className="relative border-b border-card-border bg-card">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span aria-hidden>🥔</span>
          Chipsklubben
        </Link>
        <NavLinks user={user ? { name: user.name } : null} />
      </div>
    </header>
  );
}
