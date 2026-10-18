"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { addCrispPhotoAction, deleteCrispPhotoAction } from "@/lib/actions/crisps";
import { MAX_PHOTOS_PER_CRISP } from "@/lib/photo-limits";
import CrispImage from "@/components/CrispImage";

export default function CrispPhotos({
  crispId,
  crispName,
  photos,
  canEdit,
}: {
  crispId: string;
  crispName: string;
  photos: { id: string; url: string }[];
  canEdit: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selected = photos.find((p) => p.id === selectedId) ?? photos[0] ?? null;
  const remaining = MAX_PHOTOS_PER_CRISP - photos.length;

  function upload(fileList: FileList) {
    const files = Array.from(fileList).slice(0, remaining);
    const skipped = fileList.length - files.length;
    setError(null);

    // One request per photo, so several phone photos never add up to more
    // than the server's request body limit.
    startTransition(async () => {
      const errors: string[] = [];
      for (const [i, file] of files.entries()) {
        setStatus(
          files.length > 1 ? `Uploading ${i + 1} of ${files.length}…` : "Uploading…"
        );
        const formData = new FormData();
        formData.set("crispId", crispId);
        formData.set("image", file);
        const result = await addCrispPhotoAction(undefined, formData);
        if (result?.error) errors.push(`${file.name}: ${result.error}`);
      }
      if (skipped > 0) {
        errors.push(
          `Skipped ${skipped} photo${skipped === 1 ? "" : "s"} — a crisp can have at most ${MAX_PHOTOS_PER_CRISP}.`
        );
      }
      setStatus(null);
      setError(errors.length > 0 ? errors.join("\n") : null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function remove(photoId: string) {
    if (!window.confirm("Remove this photo?")) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("photoId", photoId);
      const result = await deleteCrispPhotoAction(undefined, formData);
      if (result?.error) setError(result.error);
      if (photoId === selectedId) setSelectedId(null);
    });
  }

  return (
    <div className="space-y-2 sm:w-56 shrink-0">
      <CrispImage src={selected?.url ?? null} alt={crispName} size="large" />

      {(photos.length > 1 || (canEdit && photos.length > 0)) && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedId(photo.id)}
                aria-label="Show this photo"
                aria-pressed={photo.id === selected?.id}
                className={`relative block h-12 w-12 overflow-hidden rounded-md border-2 ${
                  photo.id === selected?.id ? "border-brand" : "border-card-border"
                }`}
              >
                <Image src={photo.url} alt="" fill sizes="48px" className="object-cover" />
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => remove(photo.id)}
                  disabled={pending}
                  aria-label="Remove this photo"
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs leading-none text-white hover:bg-red-700 disabled:opacity-60"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="text-sm space-y-1">
          {remaining > 0 ? (
            <label
              className={`inline-block rounded-md border border-card-border bg-brand-soft px-3 py-1.5 font-medium ${
                pending ? "opacity-60" : "cursor-pointer hover:opacity-90"
              }`}
            >
              {status ?? `Add photos (${photos.length}/${MAX_PHOTOS_PER_CRISP})`}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={pending}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    upload(e.target.files);
                  }
                }}
                className="sr-only"
              />
            </label>
          ) : (
            <p className="text-xs text-muted">
              {MAX_PHOTOS_PER_CRISP} of {MAX_PHOTOS_PER_CRISP} photos — remove one to add another.
            </p>
          )}
          {error && <p className="text-red-700 whitespace-pre-line">{error}</p>}
        </div>
      )}
    </div>
  );
}
