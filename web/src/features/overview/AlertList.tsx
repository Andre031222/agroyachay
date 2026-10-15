"use client";

import { AlertTriangle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import { formatNumber, METRIC_UNIT } from "@/lib/format";
import type { Alert } from "@/lib/types";
import { RelativeTime } from "../shared/RelativeTime";

export function AlertList({ alerts, onResolve, busyId }: { alerts: Alert[]; onResolve?: (alert: Alert) => void; busyId?: number | null }) {
  const { t, intl } = useI18n();
  return (
    <ul className="divide-y divide-line">
      {alerts.map((alert) => {
        const Icon = alert.kind === "offline" ? WifiOff : AlertTriangle;
        const unit = alert.metric === "connection" ? "" : METRIC_UNIT[alert.metric];
        return (
          <li key={alert.id} className="flex flex-wrap items-center gap-3 py-3.5">
            <Icon className={alert.kind === "offline" ? "size-5 text-muted" : "size-5 text-warn"} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-medium">
                {alert.kind === "offline" || alert.metric === "connection" ? t("alert.kind.offline") : `${t(`metric.${alert.metric}`)} · ${t(`alert.kind.${alert.kind}`)}`}
              </p>
              <p className="text-[14px] text-muted">
                {alert.device_name ?? `#${alert.device_id}`}
                {alert.value !== null && alert.kind !== "offline" ? ` · ${formatNumber(alert.value, intl)} ${unit}` : ""}
                {alert.threshold !== null && alert.kind !== "offline" ? ` · ${t("alert.threshold", { value: `${formatNumber(alert.threshold, intl)} ${unit}` })}` : ""}
                {" · "}
                <RelativeTime value={alert.created_at} />
              </p>
            </div>
            {onResolve && !alert.resolved_at ? (
              <Button variant="outline" onClick={() => onResolve(alert)} loading={busyId === alert.id}>
                {t("alert.resolve")}
              </Button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
