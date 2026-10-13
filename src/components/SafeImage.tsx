"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { normalizeImageUrl, FALLBACK_IMAGE } from "@/lib/imageUtils";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

export default function SafeImage({
  src,
  fallbackSrc = FALLBACK_IMAGE,
  alt,
  className,
  ...props
}: SafeImageProps) {
  const normalized = normalizeImageUrl(src, fallbackSrc);
  const [currentSrc, setCurrentSrc] = useState<string>(normalized);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state whenever the src prop changes (e.g. selecting different product variety)
  useEffect(() => {
    const updated = normalizeImageUrl(src, fallbackSrc);
    setCurrentSrc(updated);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(fallbackSrc);
    }
  };

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt || "Product image"}
      className={className}
      onError={handleError}
    />
  );
}
