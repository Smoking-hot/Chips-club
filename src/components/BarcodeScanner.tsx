"use client";

import { useEffect, useRef, useState } from "react";

const SCANNER_ELEMENT_ID = "barcode-scanner-viewport";

export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onDetectedRef = useRef(onDetected);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      if (cancelled) return;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 150 } },
          (decodedText) => {
            onDetectedRef.current(decodedText);
          },
          undefined
        );
      } catch {
        if (!cancelled) {
          setError(
            "Couldn't start the camera. Check that the browser has camera permission."
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => scanner.clear());
      }
    };
  }, []);

  return (
    <div className="rounded-lg border border-card-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Point the camera at the barcode</span>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : (
        <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-md" />
      )}
    </div>
  );
}
