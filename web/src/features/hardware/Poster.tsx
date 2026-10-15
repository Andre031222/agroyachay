"use client";

import { useState } from "react";
import Image from "next/image";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/cn";

export function Poster({ src, sizes, className, priority }: { src: string; sizes: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative block aspect-video overflow-hidden bg-surface", className)}>
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center text-muted">
          <Cpu className="size-8" aria-hidden />
        </span>
      ) : (
        <Image src={src} alt="" fill sizes={sizes} priority={priority} onError={() => setFailed(true)} className="object-cover" />
      )}
    </span>
  );
}
