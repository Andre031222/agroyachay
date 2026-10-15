import { ApiError } from "./api";
import type { MessageKey } from "./i18n";

const KNOWN: Record<string, MessageKey> = {
  network: "errors.network",
  ai_unavailable: "errors.ai_unavailable",
  ai_invalid_response: "errors.ai_invalid",
  weather_unavailable: "errors.weather_unavailable",
  rate_limited: "errors.rate_limited",
  payload_too_large: "pests.file_size",
  unsupported_media_type: "pests.file_type",
  invalid_credentials: "errors.invalid_credentials",
  email_taken: "errors.email_taken",
  account_disabled: "errors.account_disabled",
  registration_closed: "errors.registration_closed",
  google_not_configured: "auth.google_unavailable",
  google_token_invalid: "auth.google_failed",
  reset_token_invalid: "auth.reset_invalid_title",
};

export function isAiUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.code === "ai_unavailable" || error.code === "ai_invalid_response");
}

export function errorMessage(error: unknown, t: (key: MessageKey) => string): string {
  if (error instanceof ApiError) {
    const known = KNOWN[error.code];
    if (known) return t(known);
    if (error.message) return error.message;
    if (error.status === 401) return t("errors.unauthorized");
    if (error.status === 403) return t("errors.forbidden");
    if (error.status === 404) return t("errors.not_found");
    if (error.status === 422) return t("errors.validation");
    if (error.status >= 500) return t("errors.server");
  }
  return t("errors.generic");
}
