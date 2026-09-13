"use client";

import { useState } from "react";

export function FotoAmpliable({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label={`Ampliar: ${alt}`}
        className="absolute inset-0 cursor-zoom-in"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} />
      </button>

      {abierta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setAbierta(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="modal-anim max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
