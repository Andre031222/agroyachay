"use client";

import { useCallback, useState } from "react";
import { VideoOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { audioFor, captionsSrc, posterSrc, videoSrc, type HardwareSlug } from "./videos";

interface VideoPlayerProps {
  slug: HardwareSlug;
  title: string;
  autoStart?: boolean;
  className?: string;
}

export function VideoPlayer({ slug, title, autoStart, className }: VideoPlayerProps) {
  const { t, locale } = useI18n();
  const audio = audioFor(locale);
  const [failed, setFailed] = useState<string | null>(null);
  const source = videoSrc(slug, audio);

  const start = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!autoStart || !video) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      video.play().catch(() => undefined);
    },
    [autoStart],
  );

  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-[16px] bg-black", className)}>
      {failed === source ? (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
          <VideoOff className="size-8 text-muted" aria-hidden />
          <p className="max-w-sm text-[16px] text-muted">{t("hw.unavailable")}</p>
        </div>
      ) : (
        <video
          key={source}
          ref={start}
          controls
          playsInline
          preload="none"
          poster={posterSrc(slug)}
          src={source}
          aria-label={title}
          onError={() => setFailed(source)}
          className="size-full object-contain"
        >
          <track kind="captions" srcLang="es" label="Español" src={captionsSrc(slug, "es")} default={audio === "es"} />
          <track kind="captions" srcLang="en" label="English" src={captionsSrc(slug, "en")} default={audio === "en"} />
        </video>
      )}
    </div>
  );
}
