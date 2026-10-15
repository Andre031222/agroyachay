import type { MessageKey } from "@/lib/i18n";

export type GuideSlug =
  | "01-dashboard"
  | "02-crops"
  | "03-devices"
  | "04-monitoring"
  | "05-weather"
  | "06-almanac"
  | "07-pests"
  | "08-inputs"
  | "09-harvest"
  | "10-advisory"
  | "11-reports"
  | "12-profile";

export interface GuideVideo {
  slug: GuideSlug;
  number: string;
  route: string;
  title: MessageKey;
  summary: MessageKey;
  transcript: string;
}

export const GUIDE_DURATION_SECONDS = 20;

export const GUIDE_VIDEOS: readonly GuideVideo[] = [
  {
    slug: "01-dashboard",
    number: "01",
    route: "/app",
    title: "page.overview",
    summary: "guide.summary_dashboard",
    transcript:
      "This dashboard gives you a quick view of your field. It brings together your crops, sensor status, and alerts so you can see what needs attention today.",
  },
  {
    slug: "02-crops",
    number: "02",
    route: "/app/crops",
    title: "page.crops",
    summary: "guide.summary_crops",
    transcript:
      "Add the crops you grow, their area, planting date, and location. This helps AgroYachay organize useful information for each field.",
  },
  {
    slug: "03-devices",
    number: "03",
    route: "/app/devices",
    title: "page.devices",
    summary: "guide.summary_devices",
    transcript: "Connect a sensor to the crop it belongs to. Give the device a clear name so it is easy to recognize later.",
  },
  {
    slug: "04-monitoring",
    number: "04",
    route: "/app/monitoring",
    title: "page.monitoring",
    summary: "guide.summary_monitoring",
    transcript:
      "Monitoring shows temperature, air humidity, and soil moisture over time. An alert is a reason to inspect the field, not an automatic instruction.",
  },
  {
    slug: "05-weather",
    number: "05",
    route: "/app/weather",
    title: "page.weather",
    summary: "guide.summary_weather",
    transcript: "Weather helps you prepare for rain, frost, wind, and dry conditions. Use it together with what you observe in your field.",
  },
  {
    slug: "06-almanac",
    number: "06",
    route: "/app/almanac",
    title: "page.almanac",
    summary: "guide.summary_almanac",
    transcript: "The almanac brings together seasonal information, moon phases, and local agricultural timing for your location.",
  },
  {
    slug: "07-pests",
    number: "07",
    route: "/app/pests",
    title: "page.pests",
    summary: "guide.summary_pests",
    transcript:
      "Upload a clear leaf photo for an initial check. The result helps you decide what to inspect next; it is not a final diagnosis.",
  },
  {
    slug: "08-inputs",
    number: "08",
    route: "/app/inputs",
    title: "page.inputs",
    summary: "guide.summary_inputs",
    transcript: "Choose your crop, field area, and production goal. The calculator creates a simple list of materials and estimated costs.",
  },
  {
    slug: "09-harvest",
    number: "09",
    route: "/app/yield",
    title: "page.yield",
    summary: "guide.summary_harvest",
    transcript: "This page provides a planning estimate for harvest and income. Open the factors to understand what can change the result.",
  },
  {
    slug: "10-advisory",
    number: "10",
    route: "/app/advisory",
    title: "page.advisory",
    summary: "guide.summary_advisory",
    transcript: "Ask a question in your own words. When you need local expertise, you can prepare a request for an agronomist.",
  },
  {
    slug: "11-reports",
    number: "11",
    route: "/app/reports",
    title: "page.reports",
    summary: "guide.summary_reports",
    transcript:
      "Reports bring together crop, sensor, alert, and planning information. Use them to keep a record and discuss the season with an advisor.",
  },
  {
    slug: "12-profile",
    number: "12",
    route: "/app/profile",
    title: "page.profile",
    summary: "guide.summary_profile",
    transcript: "Update your language and field location here. Accurate settings make weather and calendar information more useful.",
  },
];

export const GUIDE_GROUPS: readonly { label: MessageKey; slugs: readonly GuideSlug[] }[] = [
  { label: "page.overview", slugs: ["01-dashboard"] },
  { label: "group.my_field", slugs: ["02-crops", "03-devices", "04-monitoring"] },
  { label: "group.weather_calendar", slugs: ["05-weather", "06-almanac"] },
  { label: "group.decisions", slugs: ["07-pests", "08-inputs", "09-harvest", "10-advisory"] },
  { label: "group.records", slugs: ["11-reports"] },
  { label: "footer.account", slugs: ["12-profile"] },
];

const BASE = "/videos/guide";

export function guideVideoSrc(slug: GuideSlug) {
  return `${BASE}/${slug}.mp4`;
}

export function guidePosterSrc(slug: GuideSlug) {
  return `${BASE}/${slug}.jpg`;
}

export function guideIndex(slug: string) {
  return GUIDE_VIDEOS.findIndex((video) => video.slug === slug);
}
