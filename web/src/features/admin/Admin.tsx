"use client";

import { useDeferredValue, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pencil, Plus, Search, ShieldAlert, Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Toggle } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState, InlineEmpty } from "@/components/ui/EmptyState";
import { Stat } from "@/components/ui/Stat";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAuth, isAdmin } from "@/lib/auth";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { useAsync } from "@/lib/use-async";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatDateTime, formatNumber, formatPen } from "@/lib/format";
import type { AuditFilter, PageMeta, Product, ProductCategory, ProductInput, Role, Settings, User } from "@/lib/types";
import { LoadError } from "../shared/LoadError";
import { useLabels } from "../shared/labels";

const ROLES: Role[] = ["farmer", "admin", "superadmin"];
const CATEGORIES: ProductCategory[] = ["fertilizer", "seed", "agrochemical", "amendment", "equipment"];

function Pager({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
  const { t } = useI18n();
  const pages = Math.max(1, Math.ceil(meta.total / Math.max(1, meta.per_page)));
  if (pages <= 1) return null;
  return (
    <nav aria-label={t("common.page_of", { page: meta.page, pages })} className="mt-4 flex items-center justify-between gap-3">
      <Button variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        {t("common.prev")}
      </Button>
      <span className="tabular text-[15px] text-muted">{t("common.page_of", { page: meta.page, pages })}</span>
      <Button variant="outline" disabled={meta.page >= pages} onClick={() => onPage(meta.page + 1)}>
        {t("common.next")}
      </Button>
    </nav>
  );
}

function Overview() {
  const { t, intl } = useI18n();
  const stats = useAsync(() => api.adminStats(), ["admin-stats"], "admin:stats");
  if (stats.error) return <LoadError error={stats.error} onRetry={stats.reload} />;
  if (!stats.data) return <SkeletonGrid count={5} className="grid-cols-2 lg:grid-cols-5" />;
  const data = stats.data;
  const total = data.users_total || ROLES.reduce((sum, role) => sum + (data.users_by_role[role] ?? 0), 0);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label={t("admin.stats_users")} value={formatNumber(total, intl, 0)} />
        <Stat label={t("admin.stats_active")} value={formatNumber(data.active_last_7d, intl, 0)} tone="accent" />
        <Stat label={t("admin.stats_devices")} value={formatNumber(data.devices.total, intl, 0)} hint={`${data.devices.active} ${t("devices.status.active").toLowerCase()} · ${data.devices.online} ${t("admin.stats_online")} · ${data.devices.pending} ${t("devices.status.pending").toLowerCase()}`} />
        <Stat label={t("admin.stats_readings")} value={formatNumber(data.readings_24h, intl, 0)} />
        <Stat label={t("admin.stats_diagnoses")} value={formatNumber(data.diagnoses_total, intl, 0)} hint={t("admin.diagnoses_7d", { n: data.diagnoses_7d })} className="col-span-2 lg:col-span-1" />
      </div>
      <Card>
        <CardHeader title={t("admin.by_role")} />
        <ul className="flex flex-col gap-4">
          {ROLES.map((role) => {
            const count = data.users_by_role[role] ?? 0;
            return (
              <li key={role}>
                <div className="mb-1.5 flex justify-between text-[15px]">
                  <span>{t(`role.${role}`)}</span>
                  <span className="tabular font-semibold">{formatNumber(count, intl, 0)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-line/70" aria-hidden>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function Users() {
  const { t, intl } = useI18n();
  const { user: me, hasRole } = useAuth();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferred = useDeferredValue(query.trim());
  const users = useAsync(() => api.adminUsers(deferred, page), [deferred, page]);
  const superadmin = hasRole("superadmin");

  const update = async (user: User, patch: { role?: Role; active?: boolean }) => {
    try {
      const updated = await api.updateUser(user.id, patch);
      users.setData((current) => (current ? { ...current, items: current.items.map((item) => (item.id === user.id ? (updated ?? { ...item, ...patch }) : item)) } : current));
      toast.success(t("admin.updated"));
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    }
  };

  return (
    <Card>
      <div className="relative mb-4 max-w-md">
        <Input
          label={t("admin.users_search")}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
        <Search className="pointer-events-none absolute bottom-3.5 left-3.5 size-4 text-muted" aria-hidden />
      </div>
      {users.error ? (
        <LoadError error={users.error} onRetry={users.reload} />
      ) : !users.data ? (
        <Skeleton className="h-64" />
      ) : users.data.items.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[15px]">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.user")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.role")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.active")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.joined")}</th>
                  <th scope="col" className="py-2 font-medium">{t("admin.last_login")}</th>
                </tr>
              </thead>
              <tbody>
                {users.data.items.map((user) => {
                  const self = user.id === me?.id;
                  const roleLocked = self || (!superadmin && user.role !== "farmer");
                  return (
                    <tr key={user.id} className="border-b border-line">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-[14px] text-muted">{user.email}</p>
                      </td>
                      <td className="py-2.5 pr-3">
                        <label className="sr-only" htmlFor={`role-${user.id}`}>
                          {t("admin.role")}
                        </label>
                        <select
                          id={`role-${user.id}`}
                          value={user.role}
                          disabled={roleLocked}
                          onChange={(e) => update(user, { role: e.target.value as Role })}
                          className="min-h-12 rounded-[12px] border border-line bg-bg px-3 text-[15px] disabled:opacity-60"
                        >
                          {ROLES.filter((role) => superadmin || role === "farmer" || role === user.role).map((role) => (
                            <option key={role} value={role}>
                              {t(`role.${role}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Toggle checked={user.active} disabled={self} label={`${t("admin.active")}: ${user.name}`} onChange={(active) => update(user, { active })} />
                      </td>
                      <td className="tabular py-2.5 pr-3 text-muted">{formatDate(user.created_at, intl)}</td>
                      <td className="tabular py-2.5 text-muted">{user.last_login_at ? formatDateTime(user.last_login_at, intl) : t("common.never")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager meta={users.data.meta} onPage={setPage} />
        </>
      ) : (
        <InlineEmpty>{t("admin.empty_users")}</InlineEmpty>
      )}
    </Card>
  );
}

function Audit() {
  const { t, intl } = useI18n();
  const [draft, setDraft] = useState({ action: "", user_id: "", from: "", to: "" });
  const [filter, setFilter] = useState<AuditFilter>({ page: 1 });
  const audit = useAsync(() => api.audit(filter), [filter]);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setFilter({ page: 1, action: draft.action.trim() || undefined, user_id: draft.user_id.trim() || undefined, from: draft.from || undefined, to: draft.to || undefined });
  };

  return (
    <Card>
      <form onSubmit={apply} className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_140px_170px_170px_auto]">
        <Input label={t("admin.audit_action")} value={draft.action} onChange={(e) => setDraft({ ...draft, action: e.target.value })} placeholder="login" />
        <Input label={t("admin.audit_user")} inputMode="numeric" value={draft.user_id} onChange={(e) => setDraft({ ...draft, user_id: e.target.value })} />
        <Input label={t("admin.audit_from")} type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        <Input label={t("admin.audit_to")} type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        <div className="flex items-end gap-2">
          <Button type="submit">{t("admin.filter")}</Button>
          <Button
            variant="ghost"
            onClick={() => {
              setDraft({ action: "", user_id: "", from: "", to: "" });
              setFilter({ page: 1 });
            }}
          >
            {t("admin.clear_filters")}
          </Button>
        </div>
      </form>
      {audit.error ? (
        <LoadError error={audit.error} onRetry={audit.reload} />
      ) : !audit.data ? (
        <Skeleton className="h-64" />
      ) : audit.data.items.length ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-[15px]">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.audit_when")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.audit_action")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.user")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("admin.audit_target")}</th>
                  <th scope="col" className="py-2 font-medium">{t("admin.audit_ip")}</th>
                </tr>
              </thead>
              <tbody>
                {audit.data.items.map((entry) => (
                  <tr key={entry.id} className="border-b border-line align-top">
                    <td className="tabular whitespace-nowrap py-2.5 pr-3 text-muted">{formatDateTime(entry.created_at, intl)}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={entry.action.includes("fail") ? "danger" : "neutral"}>{entry.action}</Badge>
                    </td>
                    <td className="py-2.5 pr-3">{entry.user_name ?? entry.user_email ?? (entry.user_id !== null ? `#${entry.user_id}` : "—")}</td>
                    <td className="py-2.5 pr-3 text-muted">{entry.target ?? "—"}</td>
                    <td className="py-2.5 font-mono text-[14px] text-muted">{entry.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager meta={audit.data.meta} onPage={(page) => setFilter({ ...filter, page })} />
        </>
      ) : (
        <InlineEmpty>{t("admin.empty_audit")}</InlineEmpty>
      )}
    </Card>
  );
}

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n();
  const labels = useLabels();
  const [form, setForm] = useState({
    name: product?.name ?? "",
    category: product?.category ?? "fertilizer",
    unit: product?.unit ?? "kg",
    price: product ? String(product.price_pen) : "",
    supplier: product?.supplier ?? "",
    url: product?.url ?? "",
    active: product?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const price = Number(form.price);
  const valid = form.name.trim() !== "" && form.unit.trim() !== "" && Number.isFinite(price) && price >= 0 && form.price !== "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    const input: ProductInput = {
      name: form.name.trim(),
      category: form.category,
      unit: form.unit.trim(),
      price_pen: price,
      supplier: form.supplier.trim() || null,
      url: form.url.trim() || null,
      active: form.active,
    };
    setBusy(true);
    setError("");
    try {
      if (product) await api.updateProduct(product.id, input);
      else await api.createProduct(input);
      toast.success(t("common.saved"));
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={product ? t("admin.product_edit") : t("admin.product_new")}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input label={t("admin.product_name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label={t("admin.product_category")} options={CATEGORIES.map((value) => ({ value, label: labels.category(value) }))} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })} />
          <Input label={t("admin.product_unit")} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
        </div>
        <Input label={t("admin.product_price")} inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        <Input label={t("admin.product_supplier")} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        <Input label={t("admin.product_url")} type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
        <div className="flex items-center justify-between rounded-[12px] border border-line px-4">
          <span className="text-[17px]">{t("admin.product_active")}</span>
          <Toggle checked={form.active} label={t("admin.product_active")} onChange={(active) => setForm({ ...form, active })} />
        </div>
        {error ? (
          <p role="alert" className="text-[15px] text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={busy} disabled={!valid}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Catalogue() {
  const { t, intl } = useI18n();
  const labels = useLabels();
  const products = useAsync(() => api.adminProducts(), ["admin-products"], "admin:products");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.deleteProduct(deleting.id);
      products.setData((current) => current?.filter((item) => item.id !== deleting.id));
      setDeleting(null);
      toast.success(t("admin.product_deleted"));
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={t("admin.tab_catalogue")}
        action={
          <Button onClick={() => setEditing("new")} icon={<Plus className="size-4" aria-hidden />}>
            {t("admin.product_new")}
          </Button>
        }
      />
      {products.error ? (
        <LoadError error={products.error} onRetry={products.reload} />
      ) : !products.data ? (
        <Skeleton className="h-64" />
      ) : products.data.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[15px]">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="py-2 pr-3 font-medium">{t("admin.product_name")}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t("admin.product_category")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("admin.product_price")}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t("admin.product_supplier")}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t("common.status")}</th>
                <th scope="col" className="py-2 font-medium">
                  <span className="sr-only">{t("common.actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((product) => (
                <tr key={product.id} className="border-b border-line">
                  <td className="py-2 pr-3 font-medium">{product.name}</td>
                  <td className="py-2 pr-3">{labels.category(product.category)}</td>
                  <td className="tabular py-2 pr-3 text-right">
                    {formatPen(product.price_pen, intl)} / {product.unit}
                  </td>
                  <td className="py-2 pr-3 text-muted">{product.supplier ?? "—"}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={product.active ? "accent" : "neutral"}>{product.active ? t("admin.active") : t("status.inactive")}</Badge>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`${t("common.edit")} ${product.name}`} onClick={() => setEditing(product)}>
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-danger" aria-label={`${t("common.delete")} ${product.name}`} onClick={() => setDeleting(product)}>
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <InlineEmpty>{t("inputs.catalogue_empty")}</InlineEmpty>
      )}
      {editing ? (
        <ProductForm
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            products.reload();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t("admin.product_delete_title")}
        itemName={deleting?.name ?? ""}
        message={t("admin.product_delete", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        busy={busy}
        onConfirm={remove}
      />
    </Card>
  );
}

function SettingsForm({ initial }: { initial: Settings }) {
  const { t } = useI18n();
  const [announcement, setAnnouncement] = useState(typeof initial.announcement === "string" ? initial.announcement : (initial.announcement?.es ?? ""));
  const [registrationOpen, setRegistrationOpen] = useState(initial.registration_open);
  const [regionName, setRegionName] = useState(initial.default_region.name);
  const [regionLat, setRegionLat] = useState(String(initial.default_region.latitude));
  const [regionLon, setRegionLon] = useState(String(initial.default_region.longitude));
  const [labour, setLabour] = useState(String(initial.labour_day_pen));
  const [provider, setProvider] = useState<Settings["llm_provider"]>(initial.llm_provider);
  const [busy, setBusy] = useState(false);
  const valid = [regionLat, regionLon, labour].every((value) => value.trim() !== "" && Number.isFinite(Number(value)));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      await api.saveSettings({
        announcement: announcement.trim() || null,
        registration_open: registrationOpen,
        default_region: { name: regionName.trim(), latitude: Number(regionLat), longitude: Number(regionLon) },
        labour_day_pen: Number(labour),
        llm_provider: provider,
      });
      toast.success(t("admin.settings_saved"));
    } catch (failure) {
      toast.error(errorMessage(failure, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form onSubmit={save} className="flex max-w-2xl flex-col gap-5">
        <Textarea label={t("admin.settings_announcement")} hint={t("admin.settings_announcement_hint")} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} rows={3} />
        <div className="flex items-center justify-between rounded-[12px] border border-line px-4">
          <span className="text-[17px]">{t("admin.settings_registration")}</span>
          <Toggle checked={registrationOpen} label={t("admin.settings_registration")} onChange={setRegistrationOpen} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label={t("admin.settings_region")} value={regionName} onChange={(e) => setRegionName(e.target.value)} />
          <Input label={t("admin.region_lat")} inputMode="decimal" value={regionLat} onChange={(e) => setRegionLat(e.target.value)} />
          <Input label={t("admin.region_lon")} inputMode="decimal" value={regionLon} onChange={(e) => setRegionLon(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={t("admin.labour_day")} inputMode="decimal" value={labour} onChange={(e) => setLabour(e.target.value)} />
          <Select
            label={t("admin.settings_llm")}
            options={[
              { value: "llamacpp", label: "llama.cpp (local)" },
              { value: "groq", label: "Groq" },
            ]}
            value={provider}
            onChange={(e) => setProvider(e.target.value === "groq" ? "groq" : "llamacpp")}
          />
        </div>
        <div>
          <Button type="submit" loading={busy} disabled={!valid}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SettingsPanel() {
  const { t } = useI18n();
  const { hasRole } = useAuth();
  const allowed = hasRole("superadmin");
  const settings = useAsync(allowed ? () => api.settings() : null, ["settings"]);
  if (!allowed) return <InlineEmpty>{t("admin.superadmin_only")}</InlineEmpty>;
  if (settings.error) return <LoadError error={settings.error} onRetry={settings.reload} />;
  if (!settings.data) return <Skeleton className="h-80 rounded-[20px]" />;
  return <SettingsForm initial={settings.data} />;
}

function AdminNav() {
  const { t } = useI18n();
  const { hasRole } = useAuth();
  const pathname = usePathname();
  const items: { href: string; label: MessageKey }[] = [
    { href: "/app/admin", label: "admin.tab_overview" },
    { href: "/app/admin/users", label: "admin.tab_users" },
    { href: "/app/admin/audit", label: "admin.tab_audit" },
    { href: "/app/admin/catalog", label: "admin.tab_catalogue" },
    ...(hasRole("superadmin") ? [{ href: "/app/admin/settings", label: "admin.tab_settings" as const }] : []),
  ];
  return (
    <nav aria-label={t("page.admin")} className="no-scrollbar mb-8 inline-flex max-w-full gap-1 overflow-x-auto rounded-[980px] bg-surface p-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-12 items-center whitespace-nowrap rounded-[980px] border px-4 text-[17px] font-medium",
              active ? "border-line bg-bg text-text" : "border-transparent text-muted hover:text-text",
            )}
          >
            {t(item.label)}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminFrame({ title, children }: { title: MessageKey; children: ReactNode }) {
  const { t } = useI18n();
  const { user } = useAuth();
  if (!isAdmin(user)) {
    return (
      <EmptyState
        photo="terraces"
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldAlert className="size-6 text-warn" aria-hidden />
            {t("admin.forbidden_title")}
          </span>
        }
        text={t("admin.forbidden_text")}
      />
    );
  }
  return (
    <>
      <PageHeader title={t(title)} />
      <AdminNav />
      {children}
    </>
  );
}

export function AdminHome() {
  return (
    <AdminFrame title="page.admin">
      <Overview />
    </AdminFrame>
  );
}

export function AdminUsers() {
  return (
    <AdminFrame title="admin.tab_users">
      <Users />
    </AdminFrame>
  );
}

export function AdminAudit() {
  return (
    <AdminFrame title="admin.tab_audit">
      <Audit />
    </AdminFrame>
  );
}

export function AdminCatalog() {
  return (
    <AdminFrame title="admin.tab_catalogue">
      <Catalogue />
    </AdminFrame>
  );
}

export function AdminSettings() {
  return (
    <AdminFrame title="admin.tab_settings">
      <SettingsPanel />
    </AdminFrame>
  );
}
