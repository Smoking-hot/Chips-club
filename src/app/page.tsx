import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StarRating from "@/components/StarRating";

export default async function HomePage({
  searchParams,
}: PageProps<"/">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const crisps = await prisma.crisp.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { brand: { contains: query } },
            { country: { contains: query } },
          ],
        }
      : undefined,
    include: {
      reviews: { select: { rating: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">The crisp listing</h1>
          <p className="text-muted text-sm mt-1">
            {crisps.length} crisp{crisps.length === 1 ? "" : "s"} logged by
            the club.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, brand, country…"
            className="rounded-md border border-card-border bg-card px-3 py-2 text-sm w-full sm:w-64"
          />
          <button
            type="submit"
            className="rounded-md border border-card-border px-3 py-2 text-sm hover:bg-brand-soft"
          >
            Search
          </button>
        </form>
      </div>

      {crisps.length === 0 ? (
        <p className="text-muted">
          No crisps here yet.{" "}
          <Link href="/crisps/new" className="text-brand underline">
            Add the first one
          </Link>
          .
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {crisps.map((crisp) => {
            const count = crisp.reviews.length;
            const average =
              count > 0
                ? crisp.reviews.reduce((sum, r) => sum + r.rating, 0) / count
                : 0;

            return (
              <li key={crisp.id}>
                <Link
                  href={`/crisps/${crisp.id}`}
                  className="block h-full rounded-lg border border-card-border bg-card p-4 hover:border-brand transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{crisp.name}</h2>
                      <p className="text-sm text-muted">
                        {crisp.brand} · {crisp.country}
                      </p>
                    </div>
                    {count > 0 && <StarRating value={average} size="sm" />}
                  </div>
                  <p className="text-xs text-muted mt-3">
                    {count} review{count === 1 ? "" : "s"} · added by{" "}
                    {crisp.createdBy.name}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
