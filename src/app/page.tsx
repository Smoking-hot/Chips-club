import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import StarRating from "@/components/StarRating";
import CrispImage from "@/components/CrispImage";

export default async function HomePage({
  searchParams,
}: PageProps<"/">) {
  const { q, country: countryParam } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const country = typeof countryParam === "string" ? countryParam.trim() : "";

  const where: Prisma.CrispWhereInput = {};
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { brand: { contains: query } },
      { country: { contains: query } },
    ];
  }
  if (country) {
    where.country = country;
  }

  const [crisps, countryCounts] = await Promise.all([
    prisma.crisp.findMany({
      where,
      include: {
        reviews: { select: { rating: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.crisp.groupBy({
      by: ["country"],
      _count: { _all: true },
      orderBy: { country: "asc" },
    }),
  ]);

  const hasFilters = Boolean(query || country);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">The crisp listing</h1>
          <p className="text-muted text-sm mt-1">
            {crisps.length} crisp{crisps.length === 1 ? "" : "s"}
            {country ? ` from ${country}` : ""} logged by the club.
          </p>
        </div>
        <form className="flex flex-wrap gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, brand, country…"
            className="rounded-md border border-card-border bg-card px-3 py-2 text-sm w-full sm:w-56"
          />
          <select
            name="country"
            defaultValue={country}
            className="rounded-md border border-card-border bg-card px-3 py-2 text-sm"
          >
            <option value="">All countries</option>
            {countryCounts.map((c) => (
              <option key={c.country} value={c.country}>
                {c.country} ({c._count._all})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-card-border px-3 py-2 text-sm hover:bg-brand-soft"
          >
            Filter
          </button>
          {hasFilters && (
            <Link
              href="/"
              className="rounded-md border border-card-border px-3 py-2 text-sm hover:bg-brand-soft"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {crisps.length === 0 ? (
        <p className="text-muted">
          {hasFilters ? (
            <>
              No crisps match that filter.{" "}
              <Link href="/" className="text-brand underline">
                Clear filters
              </Link>
              .
            </>
          ) : (
            <>
              No crisps here yet.{" "}
              <Link href="/crisps/new" className="text-brand underline">
                Add the first one
              </Link>
              .
            </>
          )}
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
                  className="flex h-full gap-3 rounded-lg border border-card-border bg-card p-4 hover:border-brand transition-colors"
                >
                  <CrispImage src={crisp.imageUrl} alt={crisp.name} size="thumb" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="font-semibold truncate">{crisp.name}</h2>
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
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
