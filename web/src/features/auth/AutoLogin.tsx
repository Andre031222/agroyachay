"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/common/Logo";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const ROUTE_ALIASES: Record<string, string> = {
  dispositivos: "devices",
  dashboard: "",
  inicio: "",
  cultivos: "crops",
  clima: "weather",
  monitoreo: "monitoring",
  plagas: "pests",
  insumos: "inputs",
  almanaque: "almanac",
  asesoria: "advisory",
  informes: "reports",
  perfil: "profile",
};

const KNOWN = new Set(["", "weather", "almanac", "crops", "monitoring", "devices", "inputs", "pests", "yield", "advisory", "reports", "admin", "profile"]);

export function resolveRedirect(raw: string | null): string {
  const cleaned = (raw ?? "devices").trim().replace(/^\/+/, "").replace(/^app\/?/, "").split(/[?#]/)[0].toLowerCase();
  const mapped = cleaned in ROUTE_ALIASES ? ROUTE_ALIASES[cleaned] : cleaned;
  const target = KNOWN.has(mapped) ? mapped : "devices";
  return target ? `/app/${target}` : "/app";
}

export function AutoLogin() {
  const { t } = useI18n();
  const { adoptToken } = useAuth();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const search = new URLSearchParams(window.location.search);
    const token = hash.get("token") ?? search.get("token");
    const target = resolveRedirect(hash.get("redirect") ?? search.get("redirect"));
    window.history.replaceState(null, "", window.location.pathname);
    if (!token) {
      router.replace("/login");
      return;
    }
    adoptToken(token).then(
      () => router.replace(target),
      () => {
        setFailed(true);
        window.setTimeout(() => router.replace(`/login?next=${encodeURIComponent(target)}`), 1800);
      },
    );
  }, [adoptToken, router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <LogoMark size={48} />
      {failed ? (
        <p role="alert" className="text-[17px] text-danger">
          {t("auth.auto_login_failed")}
        </p>
      ) : (
        <div role="status" className="flex items-center gap-3 text-[17px] text-muted">
          <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-accent border-r-transparent" />
          {t("auth.opening_app")}
        </div>
      )}
    </main>
  );
}
