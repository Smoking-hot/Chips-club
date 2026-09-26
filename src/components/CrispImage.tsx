import Image from "next/image";

export default function CrispImage({
  src,
  alt,
  size = "thumb",
}: {
  src: string | null;
  alt: string;
  size?: "thumb" | "large";
}) {
  const dimensions = size === "thumb" ? "h-16 w-16" : "h-56 w-full sm:w-56";

  if (!src) {
    return (
      <div
        className={`${dimensions} flex shrink-0 items-center justify-center rounded-lg border border-card-border bg-brand-soft text-2xl`}
        aria-hidden
      >
        🥔
      </div>
    );
  }

  return (
    <div className={`${dimensions} relative shrink-0 overflow-hidden rounded-lg border border-card-border`}>
      <Image src={src} alt={alt} fill sizes="224px" className="object-cover" />
    </div>
  );
}
