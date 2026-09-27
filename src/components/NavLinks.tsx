"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

type NavUser = { name: string } | null;

const linkClass = "hover:text-brand";

export default function NavLinks({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="hidden sm:flex items-center gap-4 text-sm">
        <Link href="/" className={linkClass}>
          Crisps
        </Link>
        {user ? (
          <>
            <Link href="/crisps/new" className={linkClass}>
              Add a crisp
            </Link>
            <Link href="/invites" className={linkClass}>
              Invite
            </Link>
            <span className="text-muted">{user.name}</span>
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
            <Link href="/login" className={linkClass}>
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

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="sm:hidden inline-flex items-center justify-center rounded-md border border-card-border p-2 text-foreground"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M3 5.5h14M3 10h14M3 14.5h14"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="sm:hidden absolute inset-x-0 top-full z-50 border-b border-card-border bg-card px-4 py-4 flex flex-col gap-3 text-sm shadow-lg"
        >
          <Link href="/" className={linkClass} onClick={close}>
            Crisps
          </Link>
          {user ? (
            <>
              <Link href="/crisps/new" className={linkClass} onClick={close}>
                Add a crisp
              </Link>
              <Link href="/invites" className={linkClass} onClick={close}>
                Invite
              </Link>
              <span className="text-muted">{user.name}</span>
              <form action={logoutAction} onSubmit={close}>
                <button
                  type="submit"
                  className="w-full text-left rounded-md border border-card-border px-3 py-1.5 hover:bg-brand-soft"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass} onClick={close}>
                Log in
              </Link>
              <Link
                href="/register"
                onClick={close}
                className="w-fit rounded-md bg-brand text-brand-foreground px-3 py-1.5 font-medium hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
