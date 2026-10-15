export const CROP_CODES = ["potato", "quinoa", "maize", "faba_bean", "oca", "canihua", "barley", "wheat"] as const;

export function cropImage(code: string | null | undefined, variant: "thumb" | "full" = "thumb"): string {
  const known = (CROP_CODES as readonly string[]).includes(code ?? "") ? code : "other";
  return variant === "thumb" ? `/images/crops/${known}-thumb.jpg` : `/images/crops/${known}.jpg`;
}
