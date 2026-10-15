import type { Metadata } from "next";
import { Guide } from "@/features/guide/Guide";

const description = "Twelve 20-second videos that show each part of AgroYachay, narrated in English with subtitles.";

export const metadata: Metadata = {
  title: "Video guide",
  description,
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "Video guide · AgroYachay",
    description,
    url: "/guide",
    siteName: "AgroYachay",
    images: ["/videos/guide/01-dashboard.jpg"],
    type: "website",
  },
};

export default function GuidePage() {
  return <Guide />;
}
