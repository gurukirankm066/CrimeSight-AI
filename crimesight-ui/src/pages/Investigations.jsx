import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";
import jsPDF from "jspdf";

export const Route = createFileRoute("/investigations")({
  head: () => ({
    meta: [
      { title: "Morning Brief — CrimeSight AI" },
      { name: "description", content: "AI-verified intelligence briefing with recommended actions and evidence." },
    ],
  }),
  component: MorningBriefPage,
});
function generatePDF(brief: any, officerName: string) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(22, 33, 62);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(233, 69, 96);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("CrimeSight AI", 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(170, 170, 170);
  doc.text("Karnataka State Police — Morning Intelligence Brief", 14, 26);
  doc.text(`Generated for: ${officerName} · ${brief.date}`, 14, 33);

  // Summary stats
  doc.setTextColor(233, 69, 96);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TODAY'S SUMMARY", 14, 52);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let y = 60;
  (brief.summary ?? []).forEach((s: any) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${s.label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${s.value}${s.trend ? ` (${s.trend})` : ""}`, 60, y);
    y += 8;
  });

  // Crime statistics
  y += 6;
  doc.setTextColor(233, 69, 96);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CRIME STATISTICS", 14, y);
  y += 8;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  (brief.crime_statistics ?? []).forEach((c: any) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${c.label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${c.value}${c.change ? ` ${c.change}` : ""}`, 60, y);
    y += 8;
  });

  // Recommended actions
  y += 6;
  doc.setTextColor(233, 69, 96);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RECOMMENDED ACTIONS", 14, y);
  y += 8;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  (brief.actions ?? []).forEach((a: any) => {
    doc.setFont("helvetica", "bold");
    doc.text(`[${a.priority}]`, 14, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(a.title, 160);
    doc.text(lines, 30, y);
    y += lines.length * 6 + 4;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  // Footer
  doc.setFillColor(22, 33, 62);
  doc.rect(0, 285, 210, 12, "F");
  doc.setTextColor(170, 170, 170);
  doc.setFontSize(8);
  doc.text("CrimeSight AI — Karnataka State Police Intelligence Platform — CONFIDENTIAL", 14, 292);

  doc.save(`CrimeSight_Brief_${brief.date.replace(/ /g, "_")}.pdf`);
}

function MorningBriefPage() {
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
              <button
                onClick={() => generatePDF(brief, officerName)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-variant/30 border border-white/10 text-on-surface hover:bg-white/5 transition text-[12px] font-bold uppercase tracking-wider">
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
              <div className="grid grid-cols-4 gap-4">
                {(brief.summary ?? []).map((s) => (
                  <div key={s.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
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
                {(brief.confidence_bars ?? []).map((b) => (
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
                <span className="text-[10px] text-outline">
                  {(brief.actions ?? []).length} actions
                </span>
              </div>
              <div className="space-y-3">
                {(brief.actions ?? []).map((a) => (
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
                {(brief.crime_statistics ?? []).map((c) => (
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

            <RepeatOffendersPanel />
            <VictimVulnerabilityPanel />

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
                  {(brief.evidence ?? []).map((e) => (
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

function RepeatOffendersPanel() {
  const { data, loading } = useApi(() => api.getRepeatOffenders(), []);

  return (
    <section className="col-span-12 glass-card rounded-2xl p-6 animate-entrance">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          <span className="text-[10px] font-bold text-error uppercase tracking-wider">
            Most Wanted — Repeat Offenders
          </span>
          {data && (
            <span className="text-[10px] font-mono text-outline ml-2">
              {data.total_repeat_offenders} identified via behavioral fingerprint
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-4 gap-4">
          {data.offenders.slice(0, 8).map((offender, i) => (
            <div key={i} className="bg-white/[0.03] border border-error/20 rounded-xl p-4 hover:border-error/40 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[13px] font-bold text-on-surface">{offender.name}</p>
                  <p className="text-[11px] text-outline mt-0.5">Age {offender.age} · {offender.district}</p>
                </div>
                <span className="text-[11px] font-mono font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">
                  {offender.total_firs} FIRs
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {offender.crimes.slice(0, 2).map((c, j) => (
                  <span key={j} className="text-[9px] font-bold px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-on-surface-variant uppercase tracking-wider">
                    {c.type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
function VictimVulnerabilityPanel() {
  const { data, loading } = useApi(() => api.getVictimAnalysis(), []);

  const total = data?.total_victims ?? 0;

  return (
    <section className="col-span-12 glass-card rounded-2xl p-6 animate-entrance">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-400 text-[20px]">groups</span>
          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
            Victim Vulnerability Analysis
          </span>
          {data && (
            <span className="text-[10px] font-mono text-outline ml-2">
              {total.toLocaleString()} total victims analysed
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-3 gap-6">

          {/* Gender Breakdown */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-4">Gender Breakdown</p>
            <div className="space-y-3">
              {Object.entries(data.gender_breakdown).map(([gender, count]) => {
                const pct = Math.round((count / total) * 100);
                const color = gender === "Female" ? "bg-pink-500" : gender === "Male" ? "bg-blue-500" : "bg-purple-500";
                return (
                  <div key={gender}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-on-surface-variant font-medium">{gender}</span>
                      <span className="text-on-surface font-mono">{pct}% · {count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-surface-variant/30 rounded-full overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Age Groups */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-4">Age Group Distribution</p>
            <div className="space-y-3">
              {Object.entries(data.age_groups).map(([group, count]) => {
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={group}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-on-surface-variant font-medium">{group}</span>
                      <span className="text-on-surface font-mono">{pct}% · {count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-surface-variant/30 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Crimes by Gender */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
            <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-4">Top Crimes — Female Victims</p>
            <div className="space-y-2">
              {(data.top_crimes_by_gender["Female"] ?? []).map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-[11px] text-on-surface-variant">{c.type}</span>
                  <span className="text-[11px] font-mono font-bold text-pink-400">{c.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </section>
  );
}


function ConfidenceRing({ value = 0 }: { value?: number }) {
  const safeValue = Number(value) || 0;

  const r = 38;
  const c = 2 * Math.PI * r;
  const off = c - (safeValue / 100) * c;

  return (
    <div className="relative w-[100px] h-[100px] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          className="fill-none stroke-white/10"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          className="fill-none stroke-primary pulse-red"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-on-surface font-mono">
          {safeValue}%
        </span>
        <span className="text-[9px] text-outline uppercase tracking-widest font-bold">
          Verified
        </span>
      </div>
    </div>
  );
}