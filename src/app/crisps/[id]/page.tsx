import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import StarRating from "@/components/StarRating";
import ReviewForm from "@/components/ReviewForm";

export default async function CrispPage({ params }: PageProps<"/crisps/[id]">) {
  const { id } = await params;

  const [crisp, user] = await Promise.all([
    prisma.crisp.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!crisp) {
    notFound();
  }

  const count = crisp.reviews.length;
  const average =
    count > 0
      ? crisp.reviews.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;

  const myReview = user
    ? crisp.reviews.find((r) => r.user.id === user.id)
    : undefined;
  const otherReviews = crisp.reviews.filter((r) => r.id !== myReview?.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{crisp.name}</h1>
        <p className="text-muted mt-1">
          {crisp.brand} · {crisp.country}
        </p>
        <div className="flex items-center gap-2 mt-3">
          {count > 0 ? (
            <>
              <StarRating value={average} />
              <span className="text-sm text-muted">
                {average.toFixed(1)} average · {count} review
                {count === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted">No reviews yet</span>
          )}
        </div>
        <p className="text-xs text-muted mt-2">
          Added by {crisp.createdBy.name}
        </p>
      </div>

      <section className="rounded-lg border border-card-border bg-card p-4">
        <h2 className="font-semibold mb-3">
          {myReview ? "Your review" : "Add your tasting notes"}
        </h2>
        {user ? (
          <ReviewForm
            crispId={crisp.id}
            existing={
              myReview
                ? { rating: myReview.rating, tastingNotes: myReview.tastingNotes }
                : null
            }
          />
        ) : (
          <p className="text-sm text-muted">
            <a href="/login" className="text-brand underline">
              Log in
            </a>{" "}
            to rate this crisp and add your own tasting notes.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">
          {otherReviews.length} other review{otherReviews.length === 1 ? "" : "s"}
        </h2>
        {otherReviews.length === 0 ? (
          <p className="text-sm text-muted">No one else has reviewed this yet.</p>
        ) : (
          <ul className="space-y-3">
            {otherReviews.map((review) => (
              <li
                key={review.id}
                className="rounded-lg border border-card-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{review.user.name}</span>
                  <StarRating value={review.rating} size="sm" />
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">
                  {review.tastingNotes}
                </p>
                <p className="text-xs text-muted mt-2">
                  {review.createdAt.toLocaleDateString()}
                  {review.updatedAt.getTime() - review.createdAt.getTime() > 1000
                    ? " · edited"
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
