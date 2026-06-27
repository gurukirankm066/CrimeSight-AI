import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import { KarnatakaMap } from "@/components/KarnatakaMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intelligence Command — CrimeSight AI" },
      { name: "description", content: "Real-time district crime intelligence, AI recommendations and operational status." },
      { property: "og:title", content: "Intelligence Command — CrimeSight AI" },
      { property: "og:description", content: "Real-time district crime intelligence, AI recommendations and operational status." },
    ],
  }),
  component: IntelligencePage,
});

function IntelligencePage() {
  const [zoom, setZoom] = useState(1);
  const [showReasoning, setShowReasoning] = useState(false);
  const { data, loading, error } = useApi(() => api.getDistrictDashboard(), []);
  const dashboard = useApi(() => api.getIntelligenceDashboard(), []);


  const zoomMap = (factor: number) => setZoom((z) => Math.min(Math.max(z * factor, 0.8), 2.5));

  const topRec = data?.ai_recommendations[0];
  const status = data?.operational_status;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppHeader />
      <main className="flex flex-1 mt-16 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[22%] min-w-[280px] p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest/40 border-r border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] text-primary flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-primary/80 text-xl">summarize</span>
              Today's Intelligence Brief
            </h2>
            <span className="text-[10px] font-mono text-outline/80 tracking-widest">08:00 HRS</span>
          </div>

          <section className="glass-card rounded-xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${data?.risk_level === "HIGH" ? "text-error bg-error/10" :
                data?.risk_level === "MED" ? "text-orange-400 bg-orange-400/10" :
                  "text-green-400 bg-green-400/10"
                }`}>
                Today's Priority
              </span>
              <span className="material-symbols-outlined text-outline/50 text-[18px]">open_in_full</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">
                {loading ? <Skel w="60%" /> : `District: ${data?.district ?? "—"}`}
              </h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-outline uppercase font-semibold">Crime Trend</p>
                  <p className="text-sm font-medium text-error flex items-center gap-1">
                    {loading ? "…" : `${data?.crime_trend.label} ${data?.crime_trend.delta}`}
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-outline uppercase font-semibold">Priority</p>
                  <p className="text-sm font-medium text-error">{data?.risk_level ?? "—"}</p>
                </div>
              </div>
            </div>
            {topRec && (
              <div className="bg-white/[0.03] p-3 rounded-lg border border-white/5">
                <p className="text-[12px] text-on-surface/90 leading-relaxed italic">
                  "{topRec.title}"
                </p>
              </div>
            )}
            {topRec && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-outline font-medium">
                  <span>AI CONFIDENCE</span>
                  <span className="text-primary">{topRec.confidence}%</span>
                </div>
                <div className="h-1 bg-surface-variant/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary pulse-red" style={{ width: `${topRec.confidence}%` }} />
                </div>
              </div>
            )}
            {error && (
              <p className="text-[10px] text-orange-400 font-mono uppercase tracking-wider">
                Offline preview · backend unreachable
              </p>
            )}
          </section>

          <section className="glass-card rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">High-Risk Areas</span>
            </div>
            <ul className="space-y-2">
              {(data?.high_risk_areas ?? []).slice(0, 4).map((a) => (
                <li key={a.name} className="flex items-center justify-between text-[12px]">
                  <span className="text-on-surface">{a.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] text-outline font-mono">{a.cases}</span>
                    <span className={`w-2 h-2 rounded-full ${a.risk === "HIGH" ? "bg-error" : a.risk === "MED" ? "bg-orange-400" : "bg-green-400"
                      }`} />
                  </span>
                </li>
              ))}
              {loading && <li className="h-3 bg-white/5 rounded animate-pulse" />}
            </ul>
          </section>
        </aside>

        {/* Map */}
        {/* Map */}
        <section className="flex-1 relative flex flex-col bg-[#060e20] border-x border-white/5">
          <div className="absolute top-0 w-full z-20 bg-surface-container-highest/40 backdrop-blur-md border-b border-white/5 px-6 py-2 flex items-center justify-center">
            <div className="flex flex-wrap items-center gap-6 text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">
              <span className="text-on-surface">Today's Operational Status</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical Districts: {status?.critical ?? 0}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Under Watch: {status?.watch ?? 0}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Stable: {status?.stable ?? 0}</span>
              <span className="text-outline/60 pl-4 border-l border-white/10">Last Updated: 08:00 AM Today</span>
            </div>
          </div>

          <div className="absolute inset-0 z-0" style={{ marginTop: "36px" }}>
            <KarnatakaMap
              districtSummary={dashboard.data?.districtSummary ?? {}}
              crimeTypes={dashboard.data?.crimeTypes ?? {}}
              onDistrictClick={(district) => console.log("clicked", district)}
            />
          </div>

          <div className="absolute top-12 right-6 z-20 flex items-center gap-3 glass-card px-4 py-2 rounded-full border-white/10 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
              <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">LIVE</span>
            </div>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <span className="text-[10px] text-on-surface-variant font-medium">
              {data?.total_firs ?? 0} FIRs Today · Last Sync 08:03 AM
            </span>
          </div>
        </section>

        {/* Right Panel */}
        <aside className="w-[22%] min-w-[280px] p-6 flex flex-col gap-6 overflow-y-auto bg-surface-container-lowest/40 border-l border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            <h2 className="text-[15px] text-on-surface font-semibold">AI Intelligence Officer</h2>
          </div>

          {(data?.ai_recommendations ?? []).slice(0, 3).map((rec, i) => (
            <section key={i} className="glass-card rounded-xl p-5 border-l-[3px] border-primary">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Recommendation {i + 1}</span>
              </div>
              <h3 className="text-[15px] font-bold text-on-surface leading-tight mb-3">{rec.title}</h3>
              <p className="text-[12px] text-on-surface-variant leading-relaxed mb-4">{rec.detail}</p>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-primary">CONFIDENCE: {rec.confidence}%</span>
                <button className="bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-wider transition-all">
                  Execute
                </button>
              </div>
            </section>
          ))}

          {showReasoning && (
            <section className="glass-card rounded-xl p-5 animate-entrance border border-primary/20 bg-primary/5">
              <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">Explainable AI</h4>
              <p className="text-[12px] text-on-surface/80 leading-relaxed">
                Recommendations synthesized from {data?.total_firs ?? 0} FIRs, repeat-offender network
                analysis and historical hotspot correlation across {data?.high_risk_areas.length ?? 0} flagged areas.
              </p>
            </section>
          )}

          <div className="mt-auto">
            <button
              onClick={() => setShowReasoning((v) => !v)}
              className="w-full bg-primary/10 hover:bg-primary text-primary hover:text-on-primary border border-primary/30 rounded-lg py-3 text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-primary/20"
            >
              {showReasoning ? "Hide AI Reasoning" : `Explain Why AI Flagged ${data?.district ?? "District"}`}
            </button>
          </div>
        </aside>
      </main>

      <footer className="h-52 px-6 py-6 bg-surface-container-lowest border-t border-white/5 grid grid-cols-12 gap-8">
        <div className="col-span-3 flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-outline tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
            LIVE INTELLIGENCE FEED
          </h4>
          <div className="flex-1 overflow-y-auto pr-3 space-y-4">
            {(data?.live_feed ?? []).map((f) => (
              <div key={f.time + f.text} className="flex gap-4 items-start group">
                <span className="font-mono text-[11px] text-primary/80 mt-0.5">{f.time}</span>
                <p className="text-[12px] text-on-surface-variant group-hover:text-on-surface transition-colors">
                  {f.text} <span className="text-on-surface font-medium">{f.highlight}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-6 flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-outline tracking-[0.2em]">COMMAND CARDS</h4>
          <div className="grid grid-cols-2 gap-3 flex-1">
            {[
              ["description", "Generate Intelligence Report", "Strategic analysis export"],
              ["hub", "Review Criminal Network", "Relationship mapping tool"],
              ["search_insights", "View Pending Investigations", "Active case dashboard"],
              ["history_edu", "Export Daily SITREP", "Format for leadership briefing"],
            ].map(([icon, title, sub]) => (
              <button key={title} className="glass-card rounded-xl flex items-center px-5 gap-4 hover:bg-primary/5 hover:border-primary/20 group text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">{icon}</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight">{title}</p>
                  <p className="text-[9px] text-outline mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-3 flex flex-col gap-4">
          <h4 className="text-[10px] font-bold text-outline tracking-[0.2em]">OFFICER TASKS</h4>
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {["Review Mysuru Intelligence", "Approve Patrol Recommendation"].map((t) => (
              <label key={t} className="glass-card flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-all border-white/5">
                <input type="checkbox" className="w-4 h-4 rounded-md border-white/20 bg-transparent text-primary focus:ring-0 focus:ring-offset-0" />
                <span className="text-[12px] font-medium text-on-surface-variant">{t}</span>
              </label>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[12px] text-on-surface-variant">{label}</span>
      <span className={`text-[13px] font-mono font-bold ${valueClass}`}>{value}</span>
    </div>
  );
}

function Skel({ w = "100%" }: { w?: string }) {
  return <span className="inline-block h-4 bg-white/10 rounded animate-pulse align-middle" style={{ width: w }} />;
}
