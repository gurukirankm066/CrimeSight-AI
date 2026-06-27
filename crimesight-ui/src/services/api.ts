const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000";

export type OfficerProfile = {
  full_name: string;
  rank: string;
  district: string;
  profile_image: string;
};

export type SummaryStat = {
  label: string;
  value: string | number;
  trend?: string;
  tone?: "default" | "primary" | "error" | "warning";
};

export type RecommendedAction = {
  id: string;
  priority: "HIGH" | "MED" | "LOW";
  title: string;
  subtitle: string;
  confidence: number;
};

export type EvidenceItem = {
  icon: string;
  title: string;
  detail: string;
  source: string;
};

export type ConfidenceBar = { label: string; value: number };

export type MorningBrief = {
  date: string;
  greeting_subtitle: string;
  synced_at: string;
  ai_confidence: number;
  confidence_label: string;
  confidence_subtitle: string;
  confidence_bars: ConfidenceBar[];
  summary: SummaryStat[];
  actions: RecommendedAction[];
  evidence: EvidenceItem[];
  crime_statistics: { label: string; value: number; change?: string }[];
};

export type DistrictDashboard = {
  district: string;
  risk_level: "LOW" | "MED" | "HIGH";
  total_firs: number;
  active_investigations: number;
  repeat_offenders: number;
  high_risk_areas: { name: string; risk: "LOW" | "MED" | "HIGH"; cases: number }[];
  ai_recommendations: { title: string; detail: string; confidence: number }[];
  crime_trend: { label: string; delta: string };
  live_feed: { time: string; text: string; highlight: string }[];
  operational_status: { critical: number; watch: number; stable: number };
};

export type NetworkNode = {
  id: string;
  type: "SUSPECT" | "FIR" | "VICTIM" | "VEHICLE" | "MOBILE" | "LOCATION" | "CCTV" | "BANK";
  label: string;
  size: number;
  pos: [number, number, number];
  name?: string;
  firs?: string[];
  associates?: string[];
  vehicles?: string[];
  mobiles?: string[];
  last_known_location?: string;
  risk_score?: number;
};

export type NetworkLink = { from: string; to: string; weight: number };

export type NetworkGraph = {
  root_label: string;
  nodes: NetworkNode[];
  links: NetworkLink[];
};

export type ReportItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "GENERATE" | "EXPORT" | "SCHEDULE" | "SUMMARY";
  updated_at?: string;
};

export type DownloadHistoryItem = {
  id: string;
  name: string;
  generated_at: string;
  size: string;
  type: string;
};

export type ScheduledReport = {
  id: string;
  name: string;
  cadence: string;
  next_run: string;
  recipients: number;
};

export type ReportsPayload = {
  executive_summary: string;
  executive_highlights: { label: string; value: string }[];
  reports: ReportItem[];
  history: DownloadHistoryItem[];
  scheduled: ScheduledReport[];
};
export type RepeatOffender = {
  name: string;
  age: string;
  district: string;
  total_firs: number;
  crimes: { type: string; count: number }[];
};

export type RepeatOffendersPayload = {
  total_repeat_offenders: number;
  offenders: RepeatOffender[];
};
export type VictimAnalysis = {
  total_victims: number;
  gender_breakdown: Record<string, number>;
  age_groups: Record<string, number>;
  top_crimes_by_gender: Record<string, { type: string; count: number }[]>;
};

export type DistrictCaseStats = {
  total: number;
  under_investigation: number;
  chargesheet: number;
  convicted: number;
  acquitted: number;
  closed: number;
};

export type IntelligenceDashboard = {
  districtSummary: Record<string, number>;
  crimeTypes: Record<string, Record<string, number>>;
  yearSummary: Record<string, number>;
  caseTracker: Record<string, DistrictCaseStats>;
  morningBrief: string | null;
};

async function get<T>(path: string, fallback: T): Promise<{ data: T; error: string | null; offline: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = (await res.json()) as T;
    return { data, error: null, offline: false };
  } catch (err) {
    return {
      data: fallback,
      error: err instanceof Error ? err.message : "Network error",
      offline: true,
    };
  }
}

const officerFallback: OfficerProfile = {
  full_name: "Inspector Priya",
  rank: "Inspector",
  district: "Mysuru District",
  profile_image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIhQe6sho2judN4_zmhCYvLsGhQPItyEcI-Rzr7YDi7gnlEpSwecOhLhrrqA62nU1Kth0DVbXUgkv6CnF_mFAppxHPh88MXyyXTQcoOPf7lVX3lAMacBMvEQOrkgK39lU2nOtN3049rpMzUwd8CvJTW1pzSjQJgHv1NBj7iBP2G8QUk110hpq5dsUcuSAwPeIe48jvhtXE1iqPAUJ1U7xVQWcfnTGgSXjSEZanSALXym_6t3PlkrPgC8R_-Hhnalz7Jc8IZUETrE",
};

const briefFallback: MorningBrief = {
  date: "24 Oct 2023",
  greeting_subtitle: "Mysuru District Command · 3 critical alerts require your review.",
  synced_at: "08:03",
  ai_confidence: 91,
  confidence_label: "High Reliability",
  confidence_subtitle: "Cross-validated across 4 data sources",
  confidence_bars: [
    { label: "Pattern Matching", value: 94 },
    { label: "Geospatial Correlation", value: 88 },
    { label: "Historical Precedent", value: 82 },
  ],
  summary: [
    { label: "Active Cases", value: 184, trend: "+12 since yesterday", tone: "default" },
    { label: "Pending Investigations", value: 41, trend: "9 high priority", tone: "default" },
    { label: "Repeat Offenders", value: 12, trend: "Linked across 4 FIRs", tone: "primary" },
    { label: "Critical Districts", value: 3, trend: "Mysuru · Mandya · Hassan", tone: "error" },
  ],
  actions: [
    { id: "a1", priority: "HIGH", title: "Deploy two additional patrol units to Mysuru Central", subtitle: "Burglary trend +23% · Repeat offender network active 8 PM – 2 AM", confidence: 91 },
    { id: "a2", priority: "MED", title: "Issue lookout notice for vehicle KA-09-MH-4421", subtitle: "Linked across 4 recent FIRs in Mandya Sector 2", confidence: 84 },
    { id: "a3", priority: "MED", title: "Coordinate with Hassan SP on weekend operation", subtitle: "Predictive model flags elevated risk Fri – Sun", confidence: 76 },
  ],
  evidence: [
    { icon: "analytics", title: "Pattern Match", detail: "12 burglaries in past 21 days share modus operandi: rear-window entry, 22:00 – 02:00, suburban perimeter.", source: "FIR Database · 21d window" },
    { icon: "group", title: "Network Signal", detail: "Suspects S-441 and S-512 placed at 3 of 4 crime scenes via CCTV-ANPR cross-match.", source: "ANPR · CCTV vision pipeline" },
    { icon: "map", title: "Geospatial Correlation", detail: "91% overlap with historical Q4 hotspot ring around Mysuru Central market corridor.", source: "Hotspot model v3.2" },
  ],
  crime_statistics: [
    { label: "Burglary", value: 38, change: "+23%" },
    { label: "Vehicle Theft", value: 21, change: "+8%" },
    { label: "Assault", value: 14, change: "-3%" },
    { label: "Cyber", value: 11, change: "+12%" },
  ],
};

const districtFallback: DistrictDashboard = {
  district: "Mysuru",
  risk_level: "HIGH",
  total_firs: 184,
  active_investigations: 41,
  repeat_offenders: 12,
  high_risk_areas: [
    { name: "Mysuru Central", risk: "HIGH", cases: 42 },
    { name: "Mandya Sector 2", risk: "HIGH", cases: 31 },
    { name: "Hebbal Industrial", risk: "MED", cases: 18 },
    { name: "Mandi Mohalla", risk: "MED", cases: 14 },
  ],
  ai_recommendations: [
    { title: "Deploy two additional patrol units.", detail: "Repeat offender network detected in vicinity.", confidence: 91 },
    { title: "Issue lookout for KA-09-MH-4421.", detail: "Vehicle linked to 4 recent FIRs.", confidence: 84 },
  ],
  crime_trend: { label: "Burglary", delta: "+23%" },
  live_feed: [
    { time: "08:18", text: "Repeat offender linked —", highlight: "Mandya Sector 2" },
    { time: "08:12", text: "Hotspot updated —", highlight: "Mysuru Central" },
    { time: "07:54", text: "Patrol B-12 confirmed status —", highlight: "Normal" },
  ],
  operational_status: { critical: 3, watch: 8, stable: 20 },
};

const networkFallback: NetworkGraph = {
  root_label: "Vikram S.",
  nodes: [
    { id: "ROOT", type: "SUSPECT", label: "Vikram S.", size: 18, pos: [0, 0, 0], name: "Vikram Singh", firs: ["FIR 442/23", "FIR 108/23", "FIR 005/24"], associates: ["Ramesh K.", "Suresh M.", "Priya R."], vehicles: ["KA-05-MN-992"], mobiles: ["+91 98*** 12"], last_known_location: "Mandi Mohalla, Mysuru", risk_score: 92 },
    { id: "F1", type: "FIR", label: "FIR 442/23", size: 10, pos: [120, 80, 50], firs: ["FIR 442/23"], associates: ["Vikram S."], last_known_location: "Mysuru Central", risk_score: 71 },
    { id: "S2", type: "SUSPECT", label: "Ramesh K.", size: 12, pos: [-160, 100, 40], name: "Ramesh Kumar", firs: ["FIR 108/23"], associates: ["Vikram S."], mobiles: ["+91 99*** 00"], last_known_location: "Mysuru Central", risk_score: 81 },
    { id: "S3", type: "SUSPECT", label: "Suresh M.", size: 10, pos: [-220, -180, -50], name: "Suresh Mishra", firs: ["FIR 005/24"], associates: ["Vikram S.", "Gopi N."], mobiles: ["+91 81*** 44"], last_known_location: "Hebbal Industrial", risk_score: 86 },
    { id: "L1", type: "LOCATION", label: "Mandi Mohalla", size: 10, pos: [200, -20, -10], last_known_location: "Mandi Mohalla", risk_score: 55 },
    { id: "F2", type: "FIR", label: "FIR 108/23", size: 8, pos: [-100, 200, 30], firs: ["FIR 108/23"], last_known_location: "Mysuru Central", risk_score: 68 },
    { id: "F3", type: "FIR", label: "FIR 005/24", size: 8, pos: [-380, -100, -40], firs: ["FIR 005/24"], risk_score: 72 },
  ],
  links: [
    { from: "ROOT", to: "F1", weight: 3 },
    { from: "ROOT", to: "S2", weight: 3 },
    { from: "ROOT", to: "L1", weight: 2 },
    { from: "S2", to: "F2", weight: 3 },
    { from: "S3", to: "F3", weight: 2 },
  ],
};

const reportsFallback: ReportsPayload = {
  executive_summary:
    "District activity remains elevated. Burglary up 23% week-over-week with two coordinated suspect networks active in Mysuru and Mandya. AI flags weekend window as highest-risk; recommend pre-positioning patrol assets and issuing two lookout notices today.",
  executive_highlights: [
    { label: "Cases This Week", value: "184" },
    { label: "AI Confidence", value: "91%" },
    { label: "Critical Districts", value: "3" },
    { label: "Reports Generated", value: "27" },
  ],
  reports: [
    { id: "sitrep", title: "Generate Daily SITREP", description: "Auto-compiled situational report for leadership briefing.", icon: "history_edu", category: "GENERATE" },
    { id: "brief-pdf", title: "Generate Morning Brief PDF", description: "Today's brief packaged as a signed PDF.", icon: "picture_as_pdf", category: "GENERATE" },
    { id: "district", title: "Export District Intelligence", description: "Per-district FIR, hotspot and offender export.", icon: "map", category: "EXPORT" },
    { id: "weekly", title: "Weekly Crime Report", description: "7-day rollup with trend deltas and AI commentary.", icon: "calendar_view_week", category: "GENERATE" },
    { id: "monthly", title: "Monthly Trend Report", description: "30-day analytical trend report for command review.", icon: "trending_up", category: "GENERATE" },
    { id: "exec", title: "AI Executive Summary", description: "1-page LLM-synthesized strategic overview.", icon: "auto_awesome", category: "SUMMARY" },
    { id: "schedule", title: "Report Scheduling", description: "Manage recurring report cadence and recipients.", icon: "schedule", category: "SCHEDULE" },
  ],
  history: [
    { id: "h1", name: "SITREP_2026-06-24.pdf", generated_at: "Yesterday · 19:02", size: "1.4 MB", type: "SITREP" },
    { id: "h2", name: "Morning_Brief_2026-06-24.pdf", generated_at: "Yesterday · 08:05", size: "880 KB", type: "BRIEF" },
    { id: "h3", name: "Weekly_Crime_W25.pdf", generated_at: "Mon 23 Jun · 17:40", size: "2.1 MB", type: "WEEKLY" },
  ],
  scheduled: [
    { id: "s1", name: "Daily SITREP", cadence: "Daily · 19:00", next_run: "Today · 19:00", recipients: 8 },
    { id: "s2", name: "Morning Brief", cadence: "Daily · 08:00", next_run: "Tomorrow · 08:00", recipients: 14 },
  ],
};
const repeatOffendersFallback: RepeatOffendersPayload = {
  total_repeat_offenders: 0,
  offenders: []
};
const victimAnalysisFallback: VictimAnalysis = {
  total_victims: 0,
  gender_breakdown: {},
  age_groups: {},
  top_crimes_by_gender: {},
};

const intelligenceFallback: IntelligenceDashboard = {
  districtSummary: {},
  crimeTypes: {},
  yearSummary: {},
  caseTracker: {},
  morningBrief: null,
};

export const api = {
  getOfficer: () => get<OfficerProfile>("/server/crime_sight_ai_function3/", officerFallback),
  getMorningBrief: () => get<MorningBrief>("/server/crime_sight_ai_function3/?mode=brief", briefFallback),
  getDistrictDashboard: () => get<DistrictDashboard>("/server/crime_sight_ai_function3/", districtFallback),
  getNetworkGraph: () => get<NetworkGraph>("/server/get_network_graph/", networkFallback),
  getReports: () => get<ReportsPayload>("/server/get_reports/", reportsFallback),
  getRepeatOffenders: () => get<RepeatOffendersPayload>("/server/get_repeat_offenders/", repeatOffendersFallback),
  getVictimAnalysis: () => get<VictimAnalysis>("/server/get_victim_analysis/", victimAnalysisFallback),
  getIntelligenceDashboard: () =>
    get<IntelligenceDashboard>(
      "/server/crime_sight_ai_function3/?mode=intelligence",
      intelligenceFallback
    ),

  uploadEvidence: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${BASE_URL}/server/upload_evidence/`, {
      method: "POST",
      body: formData,
    });

    return response.json();
  },
};