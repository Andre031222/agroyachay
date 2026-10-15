"use client";

import { useEffect, useRef, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export const googleEnabled = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

export function GoogleButton({ onCredential, onError }: { onCredential: (credential: string) => void; onError: () => void }) {
  const { t, locale } = useI18n();
  const { resolved } = useTheme();
  const { ref, width } = useWidth();
  return (
    <div>
      <div ref={ref} className="flex min-h-[52px] w-full items-center justify-center" aria-label={t("auth.google")}>
        {width ? (
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""} locale={locale === "en" ? "en" : "es"}>
            <GoogleLogin
              key={`${resolved}-${locale}-${Math.min(400, width)}`}
              onSuccess={(response) => (response.credential ? onCredential(response.credential) : onError())}
              onError={onError}
              shape="pill"
              size="large"
              text="continue_with"
              logo_alignment="center"
              width={String(Math.min(400, width))}
              theme={resolved === "dark" ? "filled_black" : "outline"}
            />
          </GoogleOAuthProvider>
        ) : null}
      </div>
      <div className="my-3 flex items-center gap-3 text-[15px] text-muted">
        <span className="h-px flex-1 bg-line" />
        {t("auth.or_email")}
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
