import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { AppHeader } from "@/components/AppHeader";
import { api, type ReportItem } from "@/services/api";
import { useApi } from "@/hooks/useApi";

export default function Reports() {
  usePageTitle("Intelligence Reports — CrimeSight AI");
  const { data, loading, error } = useApi(() => api.getReports(), []);
  const [preview, setPreview] = useState<ReportItem | null>(null);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppHeader />
      <main className="flex-1 mt-16 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <header className="flex items-end justify-between mb-8 animate-entrance">
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-[0.25em] mb-2">
                Strategic Exports · Reports Module
                {error && <span className="ml-2 text-orange-400">· offline preview</span>}
              </p>
              <h1 className="text-4xl font-bold text-on-surface tracking-tight">
                Intelligence <span className="text-primary">Reports</span>
              </h1>
              <p className="text-sm text-on-surface-variant mt-2">
                Generate SITREPs, export district intelligence, and schedule recurring command briefings.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary text-[12px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:brightness-110">
              <span className="material-symbols-outlined text-[18px]">add</span>
              New Report
            </button>
          </header>

          {loading && (
            <div className="grid grid-cols-12 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="col-span-4 h-40 rounded-2xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && data && (
            <div className="grid grid-cols-12 gap-6">
              {/* Executive Summary */}
              <section className="col-span-12 glass-card rounded-2xl p-6 border-l-[3px] border-primary animate-entrance">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">AI Executive Summary</span>
                  </div>
                  <button className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">Regenerate</button>
                </div>
                <p className="text-[14px] text-on-surface leading-relaxed mb-5">{data.executive_summary}</p>
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/5">
                  {data.executive_highlights.map((h) => (
                    <div key={h.label}>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{h.label}</p>
                      <p className="text-xl font-bold text-on-surface font-mono mt-1">{h.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Report cards */}
              <section className="col-span-8 animate-entrance">
                <h2 className="text-[11px] font-bold text-outline uppercase tracking-widest mb-3">Available Reports</h2>
                <div className="grid grid-cols-2 gap-4">
                  {data.reports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setPreview(r)}
                      className="glass-card rounded-xl p-5 text-left hover:border-primary/30 hover:bg-primary/[0.03] transition group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined">{r.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[13px] font-bold text-on-surface group-hover:text-primary transition-colors">{r.title}</p>
                            <span className="text-[9px] font-mono text-outline uppercase">{r.category}</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed">{r.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Scheduling */}
              <section className="col-span-4 glass-card rounded-2xl p-5 animate-entrance">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Report Scheduling</span>
                </div>
                <ul className="space-y-3">
                  {data.scheduled.map((s) => (
                    <li key={s.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-semibold text-on-surface">{s.name}</p>
                        <span className="text-[10px] text-outline font-mono">{s.recipients} recipients</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-1">{s.cadence}</p>
                      <p className="text-[10px] text-primary font-mono mt-2 uppercase tracking-wider">Next · {s.next_run}</p>
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-4 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold py-2.5 rounded-lg uppercase tracking-wider">
                  + Add Schedule
                </button>
              </section>

              {/* Download History */}
              <section className="col-span-8 glass-card rounded-2xl p-5 animate-entrance">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">download</span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Download History</span>
                  </div>
                  <span className="text-[10px] text-outline">{data.history.length} files</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-bold text-outline uppercase tracking-widest border-b border-white/5">
                      <th className="text-left py-2 font-bold">File</th>
                      <th className="text-left py-2 font-bold">Type</th>
                      <th className="text-left py-2 font-bold">Generated</th>
                      <th className="text-right py-2 font-bold">Size</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((h) => (
                      <tr key={h.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="py-3 text-[12px] text-on-surface font-mono">{h.name}</td>
                        <td className="py-3 text-[10px] text-outline uppercase tracking-wider">{h.type}</td>
                        <td className="py-3 text-[11px] text-on-surface-variant">{h.generated_at}</td>
                        <td className="py-3 text-[11px] text-on-surface-variant font-mono text-right">{h.size}</td>
                        <td className="py-3 text-right">
                          <button className="text-primary hover:underline text-[10px] font-bold uppercase tracking-wider">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* PDF Preview */}
              <section className="col-span-4 glass-card rounded-2xl p-5 animate-entrance flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-[20px]">picture_as_pdf</span>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">PDF Preview</span>
                </div>
                <div className="flex-1 bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-5 flex flex-col">
                  {preview ? (
                    <>
                      <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
                        <span className="material-symbols-outlined text-primary text-[18px]">{preview.icon}</span>
                        <p className="text-[12px] font-bold text-on-surface">{preview.title}</p>
                      </div>
                      <div className="aspect-[3/4] bg-white/[0.04] rounded-lg p-4 flex flex-col gap-2 mb-3">
                        <div className="h-2 w-3/4 bg-white/10 rounded" />
                        <div className="h-2 w-1/2 bg-white/10 rounded" />
                        <div className="h-1.5 w-full bg-white/5 rounded mt-2" />
                        <div className="h-1.5 w-5/6 bg-white/5 rounded" />
                        <div className="h-1.5 w-4/6 bg-white/5 rounded" />
                        <div className="mt-auto flex gap-1.5">
                          <div className="h-8 w-8 rounded bg-primary/20" />
                          <div className="h-8 w-8 rounded bg-primary/10" />
                          <div className="h-8 w-8 rounded bg-primary/10" />
                        </div>
                      </div>
                      <button className="bg-primary text-on-primary text-[10px] font-bold py-2 rounded-lg uppercase tracking-wider hover:brightness-110">
                        Generate {preview.title}
                      </button>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                      <p className="text-[11px] text-outline leading-relaxed">
                        Select a report to preview<br />and generate the PDF.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
