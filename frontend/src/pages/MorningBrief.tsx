import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";

export default function MorningBrief() {
  usePageTitle("Morning Brief — CrimeSight AI");
  const [query, setQuery] = useState("");
  const [showEvidence, setShowEvidence] = useState(true);
  const officer = useApi(() => api.getOfficer(), []);
  const { data: brief, loading, error } = useApi(() => api.getMorningBrief(), []);

  if (loading || !brief) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <AppHeader />
        <main className="flex-1 mt-16 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-12 gap-6">
            <div className="col-span-12 h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
            <div className="col-span-12 h-44 rounded-2xl bg-white/[0.03] animate-pulse" />
            <div className="col-span-5 h-72 rounded-2xl bg-white/[0.03] animate-pulse" />
            <div className="col-span-7 h-72 rounded-2xl bg-white/[0.03] animate-pulse" />
            <div className="col-span-12 h-56 rounded-2xl bg-white/[0.03] animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  const officerName = officer.data?.full_name ?? "Officer";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppHeader />
      <main className="flex-1 mt-16 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8 pb-40">
          <header className="flex items-end justify-between mb-8 animate-entrance">
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-[0.25em] mb-2">
                Daily Intelligence · {brief.date}
                {error && <span className="ml-2 text-orange-400">· offline preview</span>}
              </p>
              <h1 className="text-4xl font-bold text-on-surface tracking-tight">
                Good Morning, <span className="text-primary">{officerName}</span>
              </h1>
              <p className="text-sm text-on-surface-variant mt-2">{brief.greeting_subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-variant/30 border border-white/10 text-on-surface hover:bg-white/5 transition text-[12px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                Generate PDF
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:brightness-110 transition text-[12px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-[18px]">share</span>
                Share Brief
              </button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-6">
            <section className="col-span-12 glass-card rounded-2xl p-6 animate-entrance">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <h2 className="text-[15px] font-semibold text-on-surface">Today's Summary</h2>
                </div>
                <span className="text-[10px] font-mono text-outline tracking-widest">SYNCED {brief.synced_at}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {brief.summary.map((s) => (
                  <div key={s.label} className="min-w-0 bg-white/[0.03] border border-white/5 rounded-xl p-4">
                    <p className={`text-3xl font-bold tracking-tight ${s.tone === "primary" ? "text-primary" : s.tone === "error" ? "text-error" : s.tone === "warning" ? "text-orange-400" : "text-on-surface"
                      }`}>{s.value}</p>
                    <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-2">{s.label}</p>
                    {s.trend && <p className="text-[11px] text-outline mt-1">{s.trend}</p>}
                  </div>
                ))}
              </div>
            </section>

            <section className="col-span-5 glass-card rounded-2xl p-6 border-l-[3px] border-primary animate-entrance">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Verified Intelligence</span>
              </div>
              <div className="flex items-center gap-6 mb-6">
                <ConfidenceRing value={brief.ai_confidence} />
                <div>
                  <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Overall Confidence</p>
                  <h3 className="text-2xl font-bold text-on-surface mt-1">{brief.confidence_label}</h3>
                  <p className="text-[12px] text-on-surface-variant mt-1">{brief.confidence_subtitle}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-white/5">
                {brief.confidence_bars.map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-on-surface-variant font-medium">{b.label}</span>
                      <span className="text-primary font-mono">{b.value}%</span>
                    </div>
                    <div className="h-1 bg-surface-variant/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${b.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="col-span-7 glass-card rounded-2xl p-6 animate-entrance">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Recommended Actions</span>
                </div>
                <span className="text-[10px] text-outline">{brief.actions.length} actions</span>
              </div>
              <div className="space-y-3">
                {brief.actions.map((a) => (
                  <div key={a.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:border-primary/30 transition group">
                    <div className="flex items-start gap-4">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0 ${a.priority === "HIGH" ? "bg-error/15 text-error" :
                        a.priority === "MED" ? "bg-orange-500/15 text-orange-400" :
                          "bg-white/10 text-on-surface-variant"
                        }`}>{a.priority}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-on-surface leading-snug">{a.title}</p>
                        <p className="text-[12px] text-on-surface-variant mt-1">{a.subtitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-outline uppercase">Conf.</p>
                        <p className="text-[14px] font-mono font-bold text-primary">{a.confidence}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                      <button className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Execute</button>
                      <span className="text-outline">·</span>
                      <button className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider hover:text-on-surface">Defer</button>
                      <span className="text-outline">·</span>
                      <button className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider hover:text-on-surface">Assign</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="col-span-12 glass-card rounded-2xl p-6 animate-entrance">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Crime Statistics</span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {brief.crime_statistics.map((c) => (
                  <div key={c.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-outline uppercase tracking-wider">{c.label}</p>
                      <p className="text-2xl font-bold text-on-surface mt-1">{c.value}</p>
                    </div>
                    {c.change && (
                      <span className={`text-[11px] font-mono font-bold ${c.change.startsWith("-") ? "text-green-400" : "text-error"}`}>
                        {c.change}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="col-span-12 glass-card rounded-2xl p-6 animate-entrance">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Explain Why · Evidence</span>
                </div>
                <button
                  onClick={() => setShowEvidence((v) => !v)}
                  className="text-[10px] font-bold text-on-surface-variant hover:text-primary uppercase tracking-wider"
                >
                  {showEvidence ? "Collapse" : "Expand"}
                </button>
              </div>
              {showEvidence && (
                <div className="grid grid-cols-3 gap-4">
                  {brief.evidence.map((e) => (
                    <div key={e.title} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">{e.icon}</span>
                        <p className="text-[12px] font-bold text-on-surface">{e.title}</p>
                      </div>
                      <p className="text-[12px] text-on-surface-variant leading-relaxed">{e.detail}</p>
                      <p className="text-[10px] text-outline mt-3 font-mono uppercase tracking-wider">{e.source}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(720px,calc(100%-3rem))]">
        <div className="glass-card rounded-2xl border-white/10 shadow-2xl ring-1 ring-primary/20 px-3 py-2 flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask CrimeSight AI — e.g. 'Why is Mysuru flagged high risk today?'"
            className="flex-1 bg-transparent border-0 outline-none text-[13px] text-on-surface placeholder:text-outline/70 px-2"
          />
          <div className="hidden md:flex items-center gap-1 pr-1 text-[10px] text-outline font-mono">
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">⌘</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded">K</kbd>
          </div>
          <button className="px-4 h-9 rounded-xl bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider hover:brightness-110 transition">
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative w-[100px] h-[100px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="fill-none stroke-white/10" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} className="fill-none stroke-primary pulse-red"
          strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-on-surface font-mono">{value}%</span>
        <span className="text-[9px] text-outline uppercase tracking-widest font-bold">Verified</span>
      </div>
    </div>
  );
}
