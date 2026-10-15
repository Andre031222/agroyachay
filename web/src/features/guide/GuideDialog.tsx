"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Repeat, VideoOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { useReducedMotion } from "../hardware/useReducedMotion";
import { GUIDE_VIDEOS, guidePosterSrc, guideVideoSrc } from "./videos";

interface GuideDialogProps {
  index: number;
  open: boolean;
  autoStart: boolean;
  continuous: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function GuideDialog({ index, open, autoStart, continuous, onClose, onIndexChange }: GuideDialogProps) {
  const { t, locale } = useI18n();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState<string | null>(null);
  const video = GUIDE_VIDEOS[index];
  const last = GUIDE_VIDEOS.length - 1;
  const title = t(video.title);

  const start = useCallback(
    (element: HTMLVideoElement | null) => {
      if (!element || !open || !autoStart || reduced) return;
      element.play().catch(() => undefined);
    },
    [open, autoStart, reduced],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={`${video.number} · ${title}`}
      description={t("guide.position", { n: index + 1, total: GUIDE_VIDEOS.length })}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="outline" disabled={index === 0} onClick={() => onIndexChange(index - 1)} icon={<ChevronLeft className="size-[18px]" aria-hidden />}>
            {t("guide.prev")}
          </Button>
          <Button variant="outline" disabled={index === last} onClick={() => onIndexChange(index + 1)}>
            {t("guide.next")}
            <ChevronRight className="size-[18px]" aria-hidden />
          </Button>
        </div>
      }
    >
      <div className="relative aspect-video overflow-hidden rounded-[16px] bg-black">
        {failed === video.slug ? (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
            <VideoOff className="size-8 text-muted" aria-hidden />
            <p className="max-w-sm text-[16px] text-muted">{t("hw.unavailable")}</p>
          </div>
        ) : (
          <video
            key={video.slug}
            ref={start}
            controls
            playsInline
            preload="none"
            poster={guidePosterSrc(video.slug)}
            src={guideVideoSrc(video.slug)}
            aria-label={title}
            onError={() => setFailed(video.slug)}
            onEnded={() => {
              if (continuous && index < last) onIndexChange(index + 1);
            }}
            className="size-full object-contain"
          />
        )}
      </div>
      {locale !== "en" ? <p className="mt-4 text-[16px] leading-snug">{t(video.summary)}</p> : null}
      <figure className="mt-3">
        {locale !== "en" ? <figcaption className="text-[13px] font-semibold text-muted">{t("guide.narration")}</figcaption> : null}
        <blockquote lang="en" className="text-[15px] leading-relaxed text-muted">
          {video.transcript}
        </blockquote>
      </figure>
      {continuous ? (
        <p className="mt-3 flex items-center gap-2 text-[14px] text-muted">
          <Repeat className="size-4 shrink-0 text-accent" aria-hidden />
          {t("guide.watch_all_on")}
        </p>
      ) : null}
      <p className="mt-3 text-[13px] text-muted">{t("guide.audio_note")}</p>
    </Modal>
  );
}
