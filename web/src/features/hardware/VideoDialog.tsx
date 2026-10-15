"use client";

import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";
import { VideoPlayer } from "./VideoPlayer";
import { TEXT_KEY, TITLE_KEY, type HardwareSlug } from "./videos";

export default function VideoDialog({ slug, open, onClose }: { slug: HardwareSlug; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal open={open} onClose={onClose} title={t(TITLE_KEY[slug])} description={t(TEXT_KEY[slug])} size="xl">
      <VideoPlayer key={slug} slug={slug} title={t(TITLE_KEY[slug])} autoStart />
      <p className="mt-3 text-[14px] text-muted">{t("hw.audio_note")}</p>
    </Modal>
  );
}
