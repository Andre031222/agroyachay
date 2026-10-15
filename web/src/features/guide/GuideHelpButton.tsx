"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CirclePlay } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { guideIndex, type GuideSlug } from "./videos";

const GuideDialog = dynamic(() => import("./GuideDialog"), { ssr: false });

export function GuideHelpButton({ slug, className }: { slug: GuideSlug; className?: string }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(() => guideIndex(slug));
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setIndex(guideIndex(slug));
          setMounted(true);
          setOpen(true);
        }}
        className={cn(
          "inline-flex min-h-11 w-fit items-center gap-2 rounded-[980px] border border-line bg-bg px-4 text-[15px] font-medium text-text hover:bg-surface",
          className,
        )}
      >
        <CirclePlay className="size-[18px] shrink-0 text-accent" aria-hidden />
        {t("guide.watch_video")}
      </button>
      {mounted ? (
        <GuideDialog index={index} open={open} autoStart continuous={false} onClose={() => setOpen(false)} onIndexChange={setIndex} />
      ) : null}
    </>
  );
}
