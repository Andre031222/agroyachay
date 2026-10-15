"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

export function AuthImage({ src, alt, className, fill, size }: { src: string; alt: string; className?: string; fill?: boolean; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    api.pestImage(src).then(
      (blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      },
      () => undefined,
    );
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!url) return <span aria-hidden className={cn("block bg-surface", className)} style={fill ? undefined : { width: size, height: size }} />;
  return fill ? (
    <Image src={url} alt={alt} fill unoptimized className={cn("object-cover", className)} />
  ) : (
    <Image src={url} alt={alt} width={size ?? 48} height={size ?? 48} unoptimized className={cn("object-cover", className)} />
  );
}
