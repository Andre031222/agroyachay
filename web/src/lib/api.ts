import type {
  AdminStats,
  AdvisoryInput,
  AdvisoryRequest,
  Alert,
  Almanac,
  AuditEntry,
  AuditFilter,
  AuthPayload,
  ChatMessage,
  ChatReply,
  ClaimInput,
  Crop,
  CropInput,
  CropSpecies,
  Dashboard,
  Device,
  DevicePatch,
  Envelope,
  Health,
  InputsRequest,
  InputsResult,
  Locale,
  LoginResponse,
  Paged,
  PestDiagnosis,
  PestPlan,
  Product,
  ProductInput,
  ProfilePatch,
  PublicConfig,
  ReadingRange,
  ReadingsResponse,
  RegisterInput,
  ReportKind,
  ReportSummary,
  Settings,
  User,
  UserPatch,
  Weather,
  WeatherPlan,
  YieldEstimate,
  YieldInput,
} from "./types";

const TOKEN_KEY = "agroyachay.token";
const LOCALE_KEY = "agroyachay.locale";
export const UNAUTHORIZED_EVENT = "agroyachay:unauthorized";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: unknown;

  constructor(status: number, code: string, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const tokenStore = {
  get(): string | null {
    return storage()?.getItem(TOKEN_KEY) ?? null;
  },
  set(token: string) {
    storage()?.setItem(TOKEN_KEY, token);
  },
  clear() {
    storage()?.removeItem(TOKEN_KEY);
  },
};

function currentLocale(): Locale {
  const value = storage()?.getItem(LOCALE_KEY);
  return value === "en" || value === "qu" || value === "ay" ? value : "es";
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  form?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${baseUrl}/api${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

function headers(json: boolean): Headers {
  const h = new Headers({ Accept: "application/json", "Accept-Language": currentLocale() });
  if (json) h.set("Content-Type", "application/json");
  const token = tokenStore.get();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

function errorCodeFor(status: number): string {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server";
  return "bad_request";
}

async function raw(path: string, options: RequestOptions = {}): Promise<Response> {
  const hasJson = options.body !== undefined;
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers: headers(hasJson),
      body: options.form ?? (hasJson ? JSON.stringify(options.body) : undefined),
      signal: options.signal,
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(0, "network", "");
  }
  if (!response.ok) {
    let code = errorCodeFor(response.status);
    let message = "";
    let detail: unknown;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object") {
        const record = body as { error?: { code?: string; message?: string; detail?: unknown }; message?: string };
        code = record.error?.code ?? code;
        message = record.error?.message ?? record.message ?? "";
        detail = record.error?.detail;
      }
    } catch {
      message = "";
    }
    if (response.status === 401 && tokenStore.get() && !path.startsWith("/auth/login") && !path.startsWith("/auth/password/")) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, code, message, detail);
  }
  return response;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await raw(path, options);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  const body = JSON.parse(text) as Envelope<T>;
  return body.data;
}

async function paged<T>(path: string, query: Query): Promise<Paged<T>> {
  const response = await raw(path, { query });
  const body = (await response.json()) as Envelope<T[]>;
  const items = body.data ?? [];
  return { items, meta: body.meta ?? { page: Number(query.page ?? 1), per_page: items.length, total: items.length } };
}

export const api = {
  health: () => request<Health>("/health"),
  publicConfig: () => request<PublicConfig>("/config/public"),

  login: async (email: string, password: string): Promise<AuthPayload> => {
    const response = await raw("/auth/login", { method: "POST", body: { email, password } });
    const body = (await response.json()) as LoginResponse;
    return { token: body.data.token || body.token, user: body.data.user };
  },
  register: (input: RegisterInput) => request<AuthPayload>("/auth/register", { method: "POST", body: input }),
  google: (credential: string) => request<AuthPayload>("/auth/google", { method: "POST", body: { credential } }),
  me: () => request<User>("/auth/me"),
  updateMe: (patch: ProfilePatch) => request<User>("/auth/me", { method: "PATCH", body: patch }),
  changePassword: (current_password: string, new_password: string) =>
    request<unknown>("/auth/password", { method: "POST", body: { current_password, new_password } }),
  forgotPassword: (email: string, locale: Locale) => request<{ sent: boolean }>("/auth/password/forgot", { method: "POST", body: { email, locale } }),
  resetPassword: (token: string, new_password: string) => request<AuthPayload>("/auth/password/reset", { method: "POST", body: { token, new_password } }),

  dashboard: () => request<Dashboard>("/dashboard"),

  weather: (lat: number, lon: number) => request<Weather>("/weather", { query: { lat, lon } }),
  weatherPlan: (lat: number, lon: number, locale: Locale) =>
    request<WeatherPlan>("/weather/plan", { method: "POST", body: { lat, lon, locale } }),

  almanac: (year: number, month: number, lat?: number | null, lon?: number | null) =>
    request<Almanac>("/almanac", { query: { year, month, lat, lon } }),

  cropCatalog: () => request<CropSpecies[]>("/crops/catalog"),
  crops: () => request<Crop[]>("/crops"),
  crop: (id: number) => request<Crop>(`/crops/${id}`),
  createCrop: (input: CropInput) => request<Crop>("/crops", { method: "POST", body: input }),
  updateCrop: (id: number, input: Partial<CropInput>) => request<Crop>(`/crops/${id}`, { method: "PATCH", body: input }),
  deleteCrop: (id: number) => request<unknown>(`/crops/${id}`, { method: "DELETE" }),

  devices: () => request<Device[]>("/devices"),
  pendingDevices: () => request<Device[]>("/devices/pending"),
  claimDevice: (id: number, input: ClaimInput) => request<Device>(`/devices/${id}/claim`, { method: "POST", body: input }),
  updateDevice: (id: number, patch: DevicePatch) => request<Device>(`/devices/${id}`, { method: "PATCH", body: patch }),
  releaseDevice: (id: number) => request<unknown>(`/devices/${id}/release`, { method: "POST" }),
  readings: (id: number, range: ReadingRange, signal?: AbortSignal) =>
    request<ReadingsResponse>(`/devices/${id}/readings`, { query: { range }, signal }),

  alerts: (status: "open" | "all" = "open") => request<Alert[]>("/alerts", { query: { status } }),
  resolveAlert: (id: number) => request<unknown>(`/alerts/${id}/resolve`, { method: "POST" }),

  diagnose: (image: File, crop?: string, cropId?: number | null) => {
    const form = new FormData();
    form.append("image", image);
    form.append("locale", currentLocale());
    if (crop) form.append("crop", crop);
    if (cropId) form.append("crop_id", String(cropId));
    return request<PestDiagnosis>("/pests/diagnose", { method: "POST", form });
  },
  pestPlan: (id: number) => request<PestPlan>(`/pests/${id}/plan`, { method: "POST", body: { locale: currentLocale() } }),
  pestImage: async (url: string): Promise<Blob> => (await raw(url.replace(/^\/api/, ""))).blob(),
  pestHistory: () => request<PestDiagnosis[]>("/pests/history"),

  estimateYield: (input: YieldInput) => request<YieldEstimate>("/yield/estimate", { method: "POST", body: input }),
  yieldHistory: () => request<YieldEstimate[]>("/yield/history"),

  calculateInputs: (input: InputsRequest) => request<InputsResult>("/inputs/calculate", { method: "POST", body: input }),
  products: (category?: string, q?: string) => request<Product[]>("/products", { query: { category, q } }),
  adminProducts: () => request<Product[]>("/admin/products"),
  createProduct: (input: ProductInput) => request<Product>("/admin/products", { method: "POST", body: input }),
  updateProduct: (id: number, input: Partial<ProductInput>) =>
    request<Product>(`/admin/products/${id}`, { method: "PATCH", body: input }),
  deleteProduct: (id: number) => request<unknown>(`/admin/products/${id}`, { method: "DELETE" }),

  chat: (messages: ChatMessage[], locale: Locale) =>
    request<ChatReply>("/assistant/chat", { method: "POST", body: { messages, locale } }),

  advisory: (scope?: "mine") => request<AdvisoryRequest[]>("/advisory", { query: { scope } }),
  createAdvisory: (input: AdvisoryInput) => request<AdvisoryRequest>("/advisory", { method: "POST", body: input }),
  answerAdvisory: (id: number, answer: string, status: AdvisoryRequest["status"]) =>
    request<AdvisoryRequest>(`/advisory/${id}/answer`, { method: "POST", body: { answer, status } }),

  reportSummary: () => request<ReportSummary>("/reports/summary"),
  reportFile: async (kind: ReportKind): Promise<Blob> => (await raw(`/reports/${kind}.xlsx`)).blob(),

  adminStats: () => request<AdminStats>("/admin/stats"),
  adminUsers: (q: string, page: number) => paged<User>("/admin/users", { q, page }),
  updateUser: (id: number, patch: UserPatch) => request<User>(`/admin/users/${id}`, { method: "PATCH", body: patch }),
  audit: (filter: AuditFilter) => paged<AuditEntry>("/admin/audit", { ...filter }),
  settings: () => request<Settings>("/admin/settings"),
  saveSettings: (settings: Partial<Settings>) => request<Settings>("/admin/settings", { method: "PUT", body: settings }),
};
