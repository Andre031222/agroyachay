"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { LandingShell } from "../landing/LandingShell";
import { LandingNav } from "../landing/LandingNav";
import { Footer } from "../landing/Closing";
import { Poster } from "../hardware/Poster";
import { formatDuration } from "../hardware/videos";
import { GUIDE_DURATION_SECONDS, GUIDE_GROUPS, GUIDE_VIDEOS, guideIndex, guidePosterSrc, type GuideVideo } from "./videos";

const GuideDialog = dynamic(() => import("./GuideDialog"), { ssr: false });

const DURATION = formatDuration(GUIDE_DURATION_SECONDS);

function setHash(slug: string | null) {
  const url = `${window.location.pathname}${window.location.search}${slug ? `#${slug}` : ""}`;
  window.history.replaceState(window.history.state, "", url);
}

function GuideCard({ video, groupLabel, groupHeading, onPlay }: { video: GuideVideo; groupLabel: string; groupHeading?: string; onPlay: () => void }) {
  const { t, locale } = useI18n();
  const title = t(video.title);
  const eyebrow = "text-[13px] font-semibold uppercase tracking-[0.08em] text-muted";
  return (
    <article id={video.slug} className="flex min-w-0 scroll-mt-24 flex-col overflow-hidden rounded-[20px] bg-surface">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={t("hw.play", { title: `${video.number} ${title}`, time: DURATION })}
        onClick={onPlay}
        className="group relative block w-full text-left"
      >
        <Poster src={guidePosterSrc(video.slug)} sizes="(min-width: 1280px) 384px, (min-width: 640px) 50vw, 100vw" />
        <span aria-hidden className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-black text-white transition-transform duration-150 group-hover:scale-105 motion-reduce:transition-none">
            <Play className="ml-0.5 size-6 fill-current" />
          </span>
        </span>
        <span aria-hidden className="tabular absolute bottom-2 right-2 rounded-[6px] bg-black px-1.5 py-0.5 text-[12px] font-semibold text-white">
          {DURATION}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {groupHeading ? (
          <h2 id={`group-${video.slug}`} className={eyebrow}>
            {groupHeading}
          </h2>
        ) : (
          <p className={eyebrow}>{groupLabel}</p>
        )}
        <h3 className="flex items-baseline gap-2 text-[19px] font-semibold leading-snug tracking-[-0.01em]">
          <span className="tabular text-muted">{video.number}</span>
          <span className="min-w-0 flex-1">{title}</span>
        </h3>
        {locale !== "en" ? <p className="text-[15px] leading-snug">{t(video.summary)}</p> : null}
        <div className="mt-auto pt-1">
          {locale !== "en" ? <p className="text-[12px] font-semibold text-muted">{t("guide.narration")}</p> : null}
          <p lang="en" className="text-[14px] leading-relaxed text-muted">
            {video.transcript}
          </p>
        </div>
      </div>
    </article>
  );
}

export function Guide() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [continuous, setContinuous] = useState(false);

  const show = useCallback((next: number, options: { autoStart: boolean; continuous: boolean }) => {
    setIndex(next);
    setAutoStart(options.autoStart);
    setContinuous(options.continuous);
    setMounted(true);
    setOpen(true);
  }, []);

  useEffect(() => {
    const fromHash = () => {
      const next = guideIndex(decodeURIComponent(window.location.hash.slice(1)));
      if (next >= 0) show(next, { autoStart: false, continuous: false });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [show]);

  const play = (next: number, all: boolean) => {
    show(next, { autoStart: true, continuous: all });
    setHash(GUIDE_VIDEOS[next].slug);
  };

  return (
    <LandingShell>
      <LandingNav />
      <main id="main" data-lang-fade className="px-4 pb-16 pt-8 sm:px-6 sm:pb-24 sm:pt-10">
        <div className="mx-auto max-w-[1200px]">
          <PageHeader
            title={t("guide.title")}
            intro={t("guide.intro")}
            subtitle={<span className="block text-[14px] leading-snug">{t("guide.note")}</span>}
            actions={
              <Button size="lg" onClick={() => play(0, true)} icon={<Play className="size-[18px] fill-current" aria-hidden />} aria-haspopup="dialog">
                {t("guide.watch_all")}
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {GUIDE_GROUPS.map((group) => {
              const label = t(group.label);
              return (
                <section key={group.label} aria-labelledby={`group-${group.slugs[0]}`} className="contents">
                  {group.slugs.map((slug, position) => {
                    const at = guideIndex(slug);
                    return (
                      <GuideCard
                        key={slug}
                        video={GUIDE_VIDEOS[at]}
                        groupLabel={label}
                        groupHeading={position === 0 ? label : undefined}
                        onPlay={() => play(at, false)}
                      />
                    );
                  })}
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
      {mounted ? (
        <GuideDialog
          index={index}
          open={open}
          autoStart={autoStart}
          continuous={continuous}
          onClose={() => {
            setOpen(false);
            setContinuous(false);
            setHash(null);
          }}
          onIndexChange={(next) => {
            setIndex(next);
            setAutoStart(true);
            setHash(GUIDE_VIDEOS[next].slug);
          }}
        />
      ) : null}
    </LandingShell>
  );
}
