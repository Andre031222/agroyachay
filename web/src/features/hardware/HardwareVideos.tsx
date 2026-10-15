"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Play } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Poster } from "./Poster";
import { VideoPlayer } from "./VideoPlayer";
import { COMPONENT_SLUGS, DURATION_SECONDS, TEXT_KEY, TITLE_KEY, formatDuration, posterSrc, type HardwareSlug } from "./videos";

const VideoDialog = dynamic(() => import("./VideoDialog"), { ssr: false });

function DurationBadge({ slug }: { slug: HardwareSlug }) {
  return (
    <span aria-hidden className="tabular absolute bottom-2 right-2 rounded-[6px] bg-black px-1.5 py-0.5 text-[12px] font-semibold text-white">
      {formatDuration(DURATION_SECONDS[slug])}
    </span>
  );
}

export function HardwareVideos() {
  const { t } = useI18n();
  const [slug, setSlug] = useState<HardwareSlug | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="hw-title">
      <div className="mb-4">
        <h2 id="hw-title" className="text-[21px] font-semibold tracking-[-0.02em]">
          {t("hw.section_title")}
        </h2>
        <p className="mt-1 max-w-3xl text-[16px] text-muted">{t("hw.section_text")}</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[7fr_5fr]">
        <figure className="min-w-0">
          <VideoPlayer slug="kit" title={t("hw.kit_title")} />
          <figcaption className="mt-3 flex items-start justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-[17px] font-semibold">{t("hw.kit_title")}</span>
              <span className="block text-[15px] text-muted">{t("hw.kit_text")}</span>
            </span>
            <span className="tabular shrink-0 text-[14px] text-muted">{formatDuration(DURATION_SECONDS.kit)}</span>
          </figcaption>
        </figure>
        <ul className="grid grid-cols-2 content-start gap-3 sm:grid-cols-4 xl:grid-cols-2">
          {COMPONENT_SLUGS.map((item) => (
            <li key={item} className="min-w-0">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={t("hw.play", { title: t(TITLE_KEY[item]), time: formatDuration(DURATION_SECONDS[item]) })}
                onClick={() => {
                  setSlug(item);
                  setOpen(true);
                }}
                className="group flex h-full w-full flex-col overflow-hidden rounded-[16px] bg-surface text-left hover:bg-line/40"
              >
                <span className="relative block">
                  <Poster src={posterSrc(item)} sizes="(min-width: 1280px) 220px, (min-width: 640px) 25vw, 50vw" />
                  <span aria-hidden className="absolute left-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-black text-white transition-transform group-hover:scale-105 motion-reduce:transition-none">
                    <Play className="ml-0.5 size-4 fill-current" />
                  </span>
                  <DurationBadge slug={item} />
                </span>
                <span className="flex flex-col gap-0.5 p-3">
                  <span className="text-[15px] font-semibold leading-snug">{t(TITLE_KEY[item])}</span>
                  <span className="line-clamp-2 text-[13px] leading-snug text-muted">{t(TEXT_KEY[item])}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-[14px] text-muted">{t("hw.audio_note")} {t("hw.ai_label")}</p>
      {slug ? <VideoDialog slug={slug} open={open} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}
