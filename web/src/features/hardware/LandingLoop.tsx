"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { Poster } from "./Poster";
import { useReducedMotion } from "./useReducedMotion";
import { audioFor, posterSrc, videoSrc } from "./videos";

const VideoDialog = dynamic(() => import("./VideoDialog"), { ssr: false });

export function LandingLoop({ title, text, className, fill }: { title?: string; text?: string; className?: string; fill?: boolean }) {
  const { t, locale } = useI18n();
  const reduced = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [activated, setActivated] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const active = !reduced && !failed && activated;

  useEffect(() => {
    const node = box.current;
    if (!node || reduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setActivated(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    const element = video.current;
    if (!element || !active) return;
    if (visible && !open) element.play().catch(() => undefined);
    else element.pause();
  }, [active, visible, open]);

  return (
    <div ref={box} className={cn("relative flex flex-col overflow-hidden", className ?? "rounded-[20px] border border-line bg-bg")}>
      <div className={cn("relative aspect-video bg-surface", fill && "lg:flex-1 lg:aspect-auto [&_img]:object-cover [&_img]:object-[right_bottom] [&_video]:object-cover [&_video]:object-[right_bottom]")}>
        {active ? (
          <video
            ref={video}
            muted
            loop
            playsInline
            preload="none"
            poster={posterSrc("kit")}
            src={videoSrc("kit", audioFor(locale))}
            aria-hidden
            tabIndex={-1}
            onError={() => setFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <Poster src={posterSrc("kit")} sizes="(min-width: 1280px) 700px, (min-width: 1024px) 58vw, 100vw" className="absolute inset-0 size-full" />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[16px] font-semibold">{title ?? t("hw.kit_title")}</p>
          <p className="text-[14px] text-muted">{text ?? t("hw.kit_text")}</p>
          <p className="text-[13px] text-muted">{t("hw.ai_label")}</p>
        </div>
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setMounted(true);
            setOpen(true);
          }}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[980px] bg-text px-4 text-[15px] font-medium text-bg hover:opacity-90"
        >
          <Volume2 className="size-[18px]" aria-hidden />
          {t("hw.watch_sound")}
        </button>
      </div>
      {mounted ? <VideoDialog slug="kit" open={open} onClose={() => setOpen(false)} /> : null}
    </div>
  );
}
