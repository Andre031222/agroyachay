export type Locale = "es" | "en" | "qu" | "ay";
export type Role = "farmer" | "admin" | "superadmin";
export type Metric = "air_temperature" | "air_humidity" | "soil_moisture";
export type ReadingRange = "1h" | "24h" | "7d" | "30d";
export type LocalizedText = Record<Locale, string>;

export interface ApiErrorBody {
  error: { code: string; message: string; detail?: unknown };
}

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface Envelope<T> {
  data: T;
  meta?: PageMeta;
}

export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  locale: Locale;
  avatar_url: string | null;
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
  has_password: boolean;
  google_linked: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  data: AuthPayload;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  locale?: Locale;
}

export interface ProfilePatch {
  name?: string;
  locale?: Locale;
  latitude?: number | null;
  longitude?: number | null;
  place_name?: string | null;
}

export interface Region {
  name: string;
  latitude: number;
  longitude: number;
}

export interface PublicConfig {
  name: string;
  long_name: string;
  version: string;
  google_client_id: string | null;
  languages: Locale[];
  default_language: Locale;
  announcement: string | LocalizedText | null;
  default_region: Region;
  features: {
    google_login: boolean;
    registration_open: boolean;
    llm_provider: string;
    vision_engine: string;
    weather: boolean;
    almanac: boolean;
  };
}

export interface Health {
  status: "ok" | "degraded";
  name: string;
  version: string;
  database: string;
  llm: "ok" | "unavailable";
  vision: "ok" | "unavailable";
  llm_provider: string;
  llm_model: string;
  vision_model: string;
}

export interface MetricValue {
  value: number;
  unit: string;
  recorded_at: string;
}

export type LatestReadings = Partial<Record<Metric, MetricValue>>;

export interface Threshold {
  metric: Metric;
  min: number;
  max: number;
}

export type DeviceStatus = "pending" | "active" | "inactive";

export interface Device {
  id: number;
  esp32_id: string;
  name: string | null;
  status: DeviceStatus;
  online: boolean;
  crop_id: number | null;
  crop_name: string | null;
  last_seen_at: string | null;
  created_at: string;
  latest: LatestReadings;
  thresholds: Threshold[];
}

export interface ClaimInput {
  name?: string;
  crop_id?: number | null;
}

export interface DevicePatch {
  name?: string;
  crop_id?: number | null;
  thresholds?: Threshold[];
}

export interface SeriesPoint {
  t: string;
  avg: number;
  min: number;
  max: number;
  n: number;
}

export interface SeriesStats {
  min: number;
  avg: number;
  max: number;
  count: number;
}

export interface MetricSeries {
  metric: Metric;
  unit: string;
  points: SeriesPoint[];
  stats: SeriesStats | null;
}

export interface ReadingsResponse {
  device_id: number;
  range: ReadingRange;
  bucket: "raw" | "1h" | "6h";
  from: string;
  to: string;
  series: MetricSeries[];
}

export type AlertKind = "low" | "high" | "offline";
export type AlertMetric = Metric | "connection";

export interface Alert {
  id: number;
  device_id: number;
  device_name: string | null;
  esp32_id: string;
  metric: AlertMetric;
  kind: AlertKind;
  value: number | null;
  threshold: number | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DashboardCounts {
  crops: number;
  devices_active: number;
  devices_online: number;
  devices_pending: number;
  open_alerts: number;
  diagnoses: number;
}

export interface DashboardDevice {
  device_id: number;
  device_name: string | null;
  esp32_id: string;
  crop_id: number | null;
  crop_name: string | null;
  online: boolean;
  last_seen_at: string | null;
  readings: LatestReadings;
}

export interface Dashboard {
  counts: DashboardCounts;
  latest_readings: DashboardDevice[];
  recent_alerts: Alert[];
}

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  name: string | null;
  source: "query" | "profile" | "default";
  elevation: number | null;
  timezone: string;
  utc_offset_seconds: number;
}

export interface WeatherCurrent {
  time: string;
  temperature: number;
  apparent_temperature: number;
  humidity: number;
  precipitation_mm: number;
  weather_code: number;
  cloud_cover: number;
  wind_kmh: number;
  wind_direction: number;
  is_day: boolean;
}

export interface WeatherHour {
  time: string;
  temperature: number;
  humidity: number;
  precipitation_mm: number;
  precipitation_probability: number;
  wind_kmh: number;
  weather_code: number;
}

export interface WeatherDay {
  date: string;
  weather_code: number;
  temperature_min: number;
  temperature_max: number;
  precipitation_mm: number;
  precipitation_probability: number;
  et0_mm: number;
  wind_max_kmh: number;
  uv_index_max: number;
  sunrise: string;
  sunset: string;
}

export interface SprayWindow {
  start: string;
  end: string;
  hours: number;
}

export type IrrigationCode = "irrigate" | "monitor" | "not_needed";

export interface AgroIndicators {
  frost_risk: { risk: boolean; level: "none" | "moderate" | "severe"; min_temperature: number; days: string[] };
  heat_stress: { risk: boolean; max_temperature: number; days: string[] };
  rain_7d_mm: number;
  et0_7d_mm: number;
  spray_windows: SprayWindow[];
  irrigation_hint: { code: IrrigationCode; balance_mm: number; message: string };
}

export interface Weather {
  location: WeatherLocation;
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  agro: AgroIndicators;
  source: string;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface WeatherPlanDay {
  date: string;
  activities: string[];
  avoid: string[];
}

export interface WeatherPlan {
  summary: string;
  risk_level: RiskLevel;
  days: WeatherPlanDay[];
}

export type MoonPhase =
  | "new_moon"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full_moon"
  | "waning_gibbous"
  | "last_quarter"
  | "waning_crescent";

export interface AlmanacTask {
  code: string;
  label: string;
  traditional: boolean;
}

export interface AlmanacEvent {
  code: string;
  label: string;
}

export interface AlmanacDay {
  date: string;
  phase: MoonPhase;
  phase_label: string;
  illumination: number;
  moon_age_days: number;
  sunrise: string;
  sunset: string;
  day_length_min: number;
  tasks: AlmanacTask[];
  events: AlmanacEvent[];
}

export interface AlmanacPhase {
  name: "new_moon" | "first_quarter" | "full_moon" | "last_quarter";
  label: string;
  at: string;
}

export interface AlmanacSeason {
  code: "rainy" | "harvest" | "dry_frost" | "sowing";
  name: string;
  native_name: string;
  astronomical: string;
  astronomical_label: string;
}

export interface AlmanacCalendarRow {
  crop: string;
  crop_label: string;
  stage: string;
  stage_label: string;
  months: number[];
}

export interface Almanac {
  month: { year: number; month: number; name: string };
  latitude: number;
  longitude: number;
  utc_offset_minutes: number;
  season: AlmanacSeason;
  phases: AlmanacPhase[];
  days: AlmanacDay[];
  month_tasks: AlmanacTask[];
  calendar: AlmanacCalendarRow[];
  traditional_knowledge_note: string;
}

export type CropStatus = "planned" | "sown" | "growing" | "harvested" | "inactive";

export interface Range {
  min: number;
  max: number;
}

export interface CropSpecies {
  code: string;
  name: string;
  names: LocalizedText;
  scientific_name: string;
  base_yield_t_ha: number;
  price_pen_kg: number;
  cycle_days: number;
  temperature_c: Range;
  air_humidity_pct: Range;
  rainfall_30d_mm: Range;
  altitude_m: Range;
  nutrients_kg_ha: { n_kg_ha: number; p2o5_kg_ha: number; k2o_kg_ha: number };
  seed_rate_kg_ha: number;
  labour_days_ha: number;
  sowing_months: number[];
  harvest_months: number[];
}

export interface Crop {
  id: number;
  user_id: number;
  name: string;
  species: string;
  variety: string | null;
  area_ha: number;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  sowing_date: string | null;
  harvest_date: string | null;
  status: CropStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  device_count: number;
}

export interface CropInput {
  name: string;
  species: string;
  variety?: string | null;
  area_ha: number;
  latitude?: number | null;
  longitude?: number | null;
  location_name?: string | null;
  sowing_date?: string | null;
  harvest_date?: string | null;
  status: CropStatus;
  notes?: string | null;
}

export type Severity = "none" | "low" | "moderate" | "high";
export type Urgency = "immediate" | "24h" | "this_week" | "monitor";

export interface PestPlan {
  urgency: Urgency;
  steps: string[];
  products: { name: string; dose: string }[];
  organic_alternative: string;
  consult_agronomist: boolean;
}

export interface PestDiagnosis {
  id: number;
  crop_id: number | null;
  crop: string | null;
  image_url: string | null;
  engine: string;
  model: string;
  healthy: boolean;
  disease: string | null;
  scientific_name: string | null;
  confidence: number;
  severity: Severity;
  description: string;
  causes: string[];
  treatment: string[];
  prevention: string[];
  plan: PestPlan | null;
  created_at: string;
}

export interface YieldInput {
  crop_id?: number;
  species?: string;
  area_ha?: number;
  sowing_date?: string;
  lat?: number;
  lon?: number;
}

export interface ClimateFactor {
  value: number;
  observed: number | null;
  window: [number, number];
}

export interface PhenologyFactor {
  value: number;
  days_since_sowing: number | null;
  cycle_days: number;
  progress: number;
  assumed: boolean;
}

export interface YieldFactors {
  base_yield_t_ha: number;
  f_cli: number;
  g_temperature: ClimateFactor;
  g_humidity: ClimateFactor;
  g_rainfall: ClimateFactor;
  f_phe: PhenologyFactor;
  f_area: number;
  delta_data: number;
  delta_phe: number;
  sensor_readings: number;
  data_sources: string[];
}

export interface YieldEstimate {
  id: number;
  crop_id: number | null;
  crop_name: string | null;
  species: string;
  area_ha: number;
  sowing_date: string | null;
  price_pen_kg: number;
  yield_t_ha: number;
  total_t: number;
  revenue_pen: number;
  confidence: number;
  factors: YieldFactors;
  created_at: string;
}

export interface InputsRequest {
  species: string;
  area_ha: number;
  target_yield_t_ha?: number;
}

export type InputCode = "urea" | "dap" | "kcl" | "seed" | "lime" | "labour";

export interface InputItem {
  code: InputCode;
  kind: string;
  product_id: number | null;
  name: string;
  quantity: number;
  unit: string;
  unit_price_pen: number;
  subtotal_pen: number;
  amount_kg: number | null;
}

export type InputNote = "soil_test_recommended" | "split_nitrogen_application" | "lime_only_if_ph_below_5_5";

export interface InputsResult {
  species: string;
  area_ha: number;
  target_yield_t_ha: number;
  scale: number;
  nutrient_demand: { n_kg: number; p2o5_kg: number; k2o_kg: number };
  items: InputItem[];
  total_pen: number;
  cost_per_ha_pen: number;
  notes: InputNote[];
}

export type ProductCategory = "fertilizer" | "seed" | "agrochemical" | "amendment" | "equipment";

export interface Product {
  id: number;
  sku: string | null;
  name: string;
  category: ProductCategory;
  unit: string;
  price_pen: number;
  supplier: string | null;
  url: string | null;
  active: boolean;
  created_at: string;
}

export interface ProductInput {
  name: string;
  category: ProductCategory;
  unit: string;
  price_pen: number;
  supplier?: string | null;
  url?: string | null;
  active: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  provider: string;
  model: string;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export type RequestStatus = "open" | "in_progress" | "answered" | "closed";

export interface AdvisoryRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  crop_id: number | null;
  crop_name: string | null;
  topic: string;
  priority: Priority;
  description: string;
  status: RequestStatus;
  ai_draft: string | null;
  answer: string | null;
  answered_by: number | null;
  answered_by_name: string | null;
  created_at: string;
  answered_at: string | null;
}

export interface AdvisoryInput {
  topic: string;
  priority: Priority;
  description: string;
  crop_id?: number | null;
}

export interface ReportTotals {
  crops: number;
  area_ha: number;
  devices: number;
  devices_online: number;
  open_alerts: number;
  diagnoses: number;
  input_cost_pen: number;
  expected_revenue_pen: number;
  expected_margin_pen: number;
}

export interface ReportCrop extends Crop {
  input_cost_pen: number | null;
  expected_total_t: number | null;
  expected_revenue_pen: number | null;
  estimate_confidence: number | null;
  expected_margin_pen: number | null;
}

export interface ReportReading {
  metric: Metric;
  min: number;
  avg: number;
  max: number;
  count: number;
}

export interface ReportDiagnosis {
  id: number;
  crop: string | null;
  healthy: boolean;
  disease: string | null;
  confidence: number;
  severity: Severity;
  created_at: string;
}

export interface ReportSummary {
  generated_at: string;
  user: User;
  totals: ReportTotals;
  crops: ReportCrop[];
  devices: Device[];
  readings_30d: ReportReading[];
  alerts: Alert[];
  diagnoses: ReportDiagnosis[];
}

export type ReportKind = "crops" | "readings" | "finance";

export interface AdminStats {
  users_total: number;
  users_by_role: Record<Role, number>;
  active_last_7d: number;
  devices: { total: number; active: number; pending: number; online: number };
  readings_24h: number;
  diagnoses_total: number;
  diagnoses_7d: number;
}

export interface AuditEntry {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  action: string;
  target: string | null;
  ip: string | null;
  user_agent: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditFilter {
  page: number;
  action?: string;
  user_id?: string;
  from?: string;
  to?: string;
}

export interface UserPatch {
  role?: Role;
  active?: boolean;
}

export interface Settings {
  announcement: string | LocalizedText | null;
  default_region: Region;
  labour_day_pen: number;
  llm_provider: "llamacpp" | "groq";
  registration_open: boolean;
}
