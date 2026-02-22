"use client";

export function CardImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return null;
  }

  return <img src={src} alt={alt} className="custom-card-image" loading="lazy" />;
}
