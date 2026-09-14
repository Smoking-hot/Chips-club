export default function StarRating({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const rounded = Math.round(value);
  const textSize = size === "sm" ? "text-sm" : "text-base";

  return (
    <span
      className={`inline-flex text-amber-500 ${textSize}`}
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden>
          {i < rounded ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}
