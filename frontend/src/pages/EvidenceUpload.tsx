import { useEffect, useRef, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type EntityType = "person" | "vehicle" | "location" | "phone";
type Stage = "upload" | "ocr" | "ai" | "knowledge" | "network" | "done";
type CardStatus = "pending" | "completed" | "ai";

type ProcessingStep =
  | "idle"
  | "uploading"
  | "ocr"
  | "entities"
  | "summary"
  | "related"
  | "done";

interface Entity {
  id: string;
  type: EntityType;
  label: string;
  meta?: string;
}

interface OcrResult {
  caseDetails: {
    firNumber: string;
    district: string;
    policeStation: string;
    crimeType: string;
    date: string;
  };
  accused: { name: string; age: string; address: string };
  victim: { name: string; age: string; address: string; contact: string };
  extractedText: string;
  confidence: number;
}

interface AiSummary {
  riskScore: number;
  entities: Entity[];
  ipcSections: string[];
  keywords: string[];
  recommendation: string;
  crimeSight: {
    threatLevel: "Low" | "Moderate" | "High";
    crimePattern: string;
    repeatOffenderMatch: { name: string; confidence: number };
    relatedFIRCount: number;
    suggestedPatrolAction: string;
  };
}

interface TimelineEntry {
  time: string;
  label: string;
}

interface EvidenceState {
  file: File | null;
  previewUrl: string;
  uploadProgress: number;
  processingStep: ProcessingStep;
  ocr: OcrResult | null;
  aiSummary: AiSummary | null;
  timeline: TimelineEntry[];
  pipelineStage: Stage;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_SIZE_MB = 25;

const INITIAL_EVIDENCE: EvidenceState = {
  file: null,
  previewUrl: "",
  uploadProgress: 0,
  processingStep: "idle",
  ocr: null,
  aiSummary: null,
  timeline: [],
  pipelineStage: "upload",
};

const PIPELINE_STAGES: { id: Stage; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "ocr", label: "OCR" },
  { id: "ai", label: "AI Analysis" },
  { id: "knowledge", label: "Knowledge Search" },
  { id: "network", label: "Network Match" },
];

const PROCESSING_STEPS: { id: ProcessingStep; label: string }[] = [
  { id: "uploading", label: "Uploading..." },
  { id: "ocr", label: "Running OCR..." },
  { id: "entities", label: "Extracting Entities..." },
  { id: "summary", label: "Generating AI Summary..." },
  { id: "related", label: "Searching Related FIRs..." },
  { id: "done", label: "Done" },
];

const DAILY_STATS = [
  { label: "OCR Completed", value: 18, icon: "document_scanner", tone: "text-green-300" },
  { label: "Pending Review", value: 4, icon: "schedule", tone: "text-amber-300" },
  { label: "AI Flagged", value: 3, icon: "flag", tone: "text-red-300" },
  { label: "Stored Files", value: 126, icon: "folder", tone: "text-primary" },
];

const RECENT_UPLOADS = [
  {
    name: "FIR_2026_145.pdf",
    ago: "2 mins ago",
    status: "Completed" as const,
    icon: "picture_as_pdf",
  },
  {
    name: "Vehicle_Theft.jpg",
    ago: "8 mins ago",
    status: "Pending" as const,
    icon: "image",
  },
  {
    name: "Witness_Stmt_22.pdf",
    ago: "31 mins ago",
    status: "Completed" as const,
    icon: "picture_as_pdf",
  },
  {
    name: "CCTV_Frame_07.png",
    ago: "1 hr ago",
    status: "AI Flagged" as const,
    icon: "image",
  },
];

const DUMMY_OCR: OcrResult = {
  caseDetails: {
    firNumber: "FIR/2026/00471",
    district: "South Bengaluru",
    policeStation: "Jayanagar PS",
    crimeType: "Vehicle Theft (IPC 379)",
    date: "26 Jun 2026",
  },
  accused: {
    name: "Rakesh Murthy",
    age: "32",
    address: "No. 14, 4th Cross, BTM Layout, Bengaluru",
  },
  victim: {
    name: "Anitha Rao",
    age: "41",
    address: "No. 88, 9th Main, Jayanagar 4th Block",
    contact: "+91 98xxxx2207",
  },
  extractedText: `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C.)
FIR No: 00471/2026   Date: 26.06.2026   Time: 08:42

Complainant: Smt. Anitha Rao, aged 41 years, R/o No.88, 9th Main, Jayanagar.
Statement: On the night of 25.06.2026, the complainant parked her two-wheeler
(KA-05-MJ-4421, Honda Activa, white) in front of her residence at approximately
22:15 hrs. On the morning of 26.06.2026 at 06:30 hrs, the vehicle was found
missing. CCTV footage from the neighbouring shop shows one male, mid-thirties,
wearing a dark hooded jacket, approaching the vehicle at 02:14 hrs.

Suspect identified through facial match against PS Jayanagar repeat-offender
database as Rakesh Murthy (32), previously booked under FIR 00219/2024 for a
similar offence. Suspect last seen near Mico Layout bus stand.

Offence: Theft of motor vehicle. Sections: IPC 379, IPC 411 r/w 34.
Investigating Officer: PSI Suresh Kumar (Badge 24091).`,
  confidence: 94,
};

const DUMMY_AI_SUMMARY: AiSummary = {
  riskScore: 78,
  entities: [
    { id: "p1", type: "person", label: "Rakesh Murthy", meta: "Repeat offender" },
    { id: "v1", type: "vehicle", label: "KA-05-MJ-4421", meta: "Honda Activa, white" },
    { id: "l1", type: "location", label: "Mico Layout bus stand" },
    { id: "ph1", type: "phone", label: "+91 98xxxx2207" },
    { id: "p2", type: "person", label: "Anitha Rao", meta: "Complainant" },
    { id: "l2", type: "location", label: "Jayanagar 4th Block" },
  ],
  ipcSections: ["379", "411", "34"],
  keywords: ["two-wheeler", "night theft", "CCTV match", "repeat offender"],
  recommendation:
    "Dispatch patrol unit to Mico Layout corridor between 22:00–04:00 hrs. Cross-check suspect movement against prior FIR 00219/2024.",
  crimeSight: {
    threatLevel: "High",
    crimePattern: "Repeat vehicle theft cluster — South Bengaluru night corridor",
    repeatOffenderMatch: { name: "Rakesh Murthy", confidence: 91 },
    relatedFIRCount: 7,
    suggestedPatrolAction:
      "Increase night patrol on Jayanagar↔BTM corridor for 72 hrs; alert Mico Layout beat constable.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmtSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const nowHHMM = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

const ENTITY_ICON: Record<EntityType, string> = {
  person: "person_search",
  vehicle: "directions_car",
  location: "location_on",
  phone: "call",
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function EvidenceUpload() {
  usePageTitle("Evidence Upload & OCR Analysis — CrimeSight AI");
  const [evidence, setEvidence] = useState<EvidenceState>(INITIAL_EVIDENCE);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    stepTimers.current.forEach((t) => clearTimeout(t));
    stepTimers.current = [];
  };

  useEffect(() => {
    return () => {
      if (evidence.previewUrl) URL.revokeObjectURL(evidence.previewUrl);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── File selection ────────────────────────────────────────────────────────
  const acceptFile = (file: File) => {
    const ok = ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.type);
    if (!ok) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return;
    setEvidence((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        ...INITIAL_EVIDENCE,
        file,
        previewUrl: URL.createObjectURL(file),
        pipelineStage: "upload",
      };
    });
  };

  const handleClear = () => {
    clearTimers();
    setEvidence((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return INITIAL_EVIDENCE;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Handlers (TODO: backend) ──────────────────────────────────────────────

  function handleUpload() {
    // TODO: integrate Catalyst OCR backend
    if (!evidence.file || evidence.processingStep !== "idle") return;
    clearTimers();
    setEvidence((prev) => ({
      ...prev,
      uploadProgress: 0,
      processingStep: "uploading",
      pipelineStage: "upload",
    }));

    // Animate progress 0→100 over the "uploading" phase
    const progressTick = setInterval(() => {
      setEvidence((prev) => {
        if (prev.processingStep !== "uploading") {
          clearInterval(progressTick);
          return prev;
        }
        const next = Math.min(100, prev.uploadProgress + 8);
        return { ...prev, uploadProgress: next };
      });
    }, 90);
    stepTimers.current.push(progressTick as unknown as ReturnType<typeof setTimeout>);

    const schedule = (delay: number, fn: () => void) => {
      stepTimers.current.push(setTimeout(fn, delay));
    };

    schedule(1300, () => {
      clearInterval(progressTick);
      setEvidence((prev) => ({
        ...prev,
        uploadProgress: 100,
        processingStep: "ocr",
        pipelineStage: "ocr",
      }));
    });
    schedule(2400, () => {
      setEvidence((prev) => ({
        ...prev,
        ocr: DUMMY_OCR,
        processingStep: "entities",
        timeline: [
          { time: nowHHMM(), label: "Uploaded" },
          { time: nowHHMM(), label: "OCR Completed" },
        ],
      }));
    });
    schedule(3300, () => {
      setEvidence((prev) => ({ ...prev, processingStep: "summary", pipelineStage: "ai" }));
    });
    schedule(4400, () => {
      setEvidence((prev) => ({
        ...prev,
        aiSummary: DUMMY_AI_SUMMARY,
        processingStep: "related",
        pipelineStage: "knowledge",
        timeline: [...prev.timeline, { time: nowHHMM(), label: "AI Analysis Completed" }],
      }));
    });
    schedule(5400, () => {
      setEvidence((prev) => ({ ...prev, processingStep: "done" }));
    });
  }

  function handleSave() {
    // TODO: persist evidence state (OCR + AI summary + timeline) to backend
    setEvidence((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { time: nowHHMM(), label: "Saved to Database" }],
    }));
  }

  function handleGenerateSummary() {
    // TODO: call AI summary endpoint (OCR → QuickML → AI)
  }

  function handleGenerateCaseBrief() {
    // TODO: call QuickML AI Case Brief (suspect / victim / officer briefing)
  }

  function handleRelatedCases() {
    // TODO: RAG related-cases search
  }

  function handleContinueInvestigation() {
    // TODO: route to /network with seeded entities
    setEvidence((prev) => ({ ...prev, pipelineStage: "network" }));
  }

  function handleEntityPerson(_e: Entity) {
    // TODO: open Criminal Network for entity
  }
  function handleEntityVehicle(_e: Entity) {
    // TODO: search vehicle records
  }
  function handleEntityLocation(_e: Entity) {
    // TODO: open map at entity location
  }
  function handleEntityPhone(_e: Entity) {
    // TODO: search phone records
  }

  const dispatchEntity = (e: Entity) => {
    if (e.type === "person") handleEntityPerson(e);
    else if (e.type === "vehicle") handleEntityVehicle(e);
    else if (e.type === "location") handleEntityLocation(e);
    else handleEntityPhone(e);
  };

  // ── Derived UI ────────────────────────────────────────────────────────────
  const uploadStatus: CardStatus =
    evidence.processingStep === "done" || evidence.ocr ? "completed" : "pending";
  const previewStatus: CardStatus = evidence.file ? "completed" : "pending";
  const ocrStatus: CardStatus = evidence.ocr ? "completed" : "pending";
  const aiStatus: CardStatus = evidence.aiSummary ? "ai" : "pending";
  const timelineStatus: CardStatus = evidence.timeline.length ? "ai" : "pending";

  const isPdf = evidence.file?.type === "application/pdf";
  const isImage = evidence.file?.type.startsWith("image/");
  const isProcessing =
    evidence.processingStep !== "idle" && evidence.processingStep !== "done";
  const hasFile = !!evidence.file;

  return (
    <div className="min-h-screen pt-24 px-6 pb-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 animate-entrance">
          <div>
            <h1 className="text-3xl font-bold text-on-surface tracking-tight">
              Evidence Upload &amp; OCR Analysis
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
              Upload FIRs, scanned reports, or evidence documents for AI extraction.
            </p>
          </div>
          <PipelineBadge stage={evidence.pipelineStage} />
        </div>

        {/* Top row: Upload + sidebar (stats + recent) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SectionCard title="Upload Evidence" icon="upload_file" status={uploadStatus}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) acceptFile(f);
                }}
                className={cn(
                  "rounded-xl border-2 border-dashed p-8 text-center transition-all",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-white/10 hover:border-white/20",
                )}
              >
                <span className="material-symbols-outlined text-[44px] text-on-surface-variant">
                  cloud_upload
                </span>
                <p className="text-sm text-on-surface mt-2 font-medium">
                  Drop files anywhere in this box
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  or select a document from your device
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) acceptFile(f);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center gap-2 px-4 h-9 rounded-md bg-surface-container-high hover:bg-surface-container-highest text-sm text-on-surface font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">attach_file</span>
                  Choose File
                </button>

                <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                  <div className="rounded-lg p-3 bg-surface-container/50 border border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                      Supported Files
                    </p>
                    <ul className="mt-1.5 grid grid-cols-2 gap-y-1 text-xs text-on-surface">
                      {["PDF", "JPG", "PNG", "JPEG"].map((t) => (
                        <li key={t} className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-green-400">
                            check
                          </span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg p-3 bg-surface-container/50 border border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
                      Maximum Size
                    </p>
                    <p className="text-2xl font-bold text-on-surface mt-1 tabular-nums">
                      {MAX_SIZE_MB}
                      <span className="text-sm text-on-surface-variant ml-1">MB</span>
                    </p>
                  </div>
                </div>
              </div>

              {evidence.file && (
                <div className="mt-4 flex items-center justify-between gap-4 p-3 rounded-lg bg-surface-container/60 border border-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-primary">
                      {isPdf ? "picture_as_pdf" : "image"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-on-surface truncate font-medium">
                        {evidence.file.name}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {fmtSize(evidence.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleUpload}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-primary-container text-on-primary-container text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                      Upload
                    </button>
                    <button
                      onClick={handleClear}
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-sm text-on-surface-variant hover:bg-white/5 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {(isProcessing || evidence.uploadProgress > 0) && (
                <ProcessingStepper
                  current={evidence.processingStep}
                  uploadProgress={evidence.uploadProgress}
                />
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Today's Evidence" icon="insights" status="ai" compact>
              <div className="grid grid-cols-2 gap-3">
                {DAILY_STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg p-3 bg-surface-container/60 border border-white/5"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "material-symbols-outlined text-[16px]",
                          s.tone,
                        )}
                      >
                        {s.icon}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        {s.label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-on-surface mt-1 tabular-nums">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Recent Evidence" icon="history" status="completed" compact>
              <ul className="space-y-2">
                {RECENT_UPLOADS.map((r) => (
                  <li
                    key={r.name}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary">{r.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-on-surface font-medium truncate">{r.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{r.ago}</p>
                    </div>
                    <RecentStatusPill status={r.status} />
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>

        {/* Preview */}
        {evidence.file && (
          <SectionCard
            title="Evidence Preview"
            icon="preview"
            status={previewStatus}
            caption={`${evidence.file.name} · ${fmtSize(evidence.file.size)}`}
          >
            <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
              {isPdf ? (
                <iframe
                  src={evidence.previewUrl}
                  title="Evidence PDF preview"
                  className="w-full h-[600px] bg-white"
                />
              ) : isImage ? (
                <div className="flex justify-center max-h-[600px] overflow-auto">
                  <img
                    src={evidence.previewUrl}
                    alt={evidence.file.name}
                    className="max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-on-surface-variant text-sm">
                  Preview not available for this file type.
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Empty state when nothing uploaded */}
        {!hasFile && <EmptyState />}

        {/* OCR Results (always rendered with placeholder, replaced when ready) */}
        <SectionCard title="OCR Results" icon="document_scanner" status={ocrStatus}>
          {evidence.ocr ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard title="Case Details" icon="gavel">
                <Field label="FIR Number" value={evidence.ocr.caseDetails.firNumber} mono />
                <Field label="District" value={evidence.ocr.caseDetails.district} />
                <Field label="Police Station" value={evidence.ocr.caseDetails.policeStation} />
                <Field label="Crime Type" value={evidence.ocr.caseDetails.crimeType} />
                <Field label="Date" value={evidence.ocr.caseDetails.date} />
              </InfoCard>
              <InfoCard title="Accused Information" icon="person">
                <Field label="Name" value={evidence.ocr.accused.name} />
                <Field label="Age" value={evidence.ocr.accused.age} />
                <Field label="Address" value={evidence.ocr.accused.address} />
              </InfoCard>
              <InfoCard title="Victim Information" icon="shield_person">
                <Field label="Name" value={evidence.ocr.victim.name} />
                <Field label="Age" value={evidence.ocr.victim.age} />
                <Field label="Address" value={evidence.ocr.victim.address} />
                <Field label="Contact" value={evidence.ocr.victim.contact} mono />
              </InfoCard>
              <InfoCard title="Confidence" icon="verified">
                <ConfidenceRing value={evidence.ocr.confidence} />
              </InfoCard>
            </div>
          ) : (
            <Placeholder
              icon="document_scanner"
              text={isProcessing ? "Running OCR on uploaded document..." : "Waiting for upload..."}
            />
          )}
        </SectionCard>

        {/* Editable OCR text */}
        {evidence.ocr && (
          <SectionCard
            title="Extracted Text (Editable)"
            icon="edit_note"
            status="completed"
            caption="Officers can correct names, IDs, or addresses before saving."
          >
            <textarea
              value={evidence.ocr.extractedText}
              onChange={(e) => {
                const text = e.target.value;
                setEvidence((prev) =>
                  prev.ocr ? { ...prev, ocr: { ...prev.ocr, extractedText: text } } : prev,
                );
              }}
              className="w-full min-h-64 rounded-lg bg-surface-container/60 border border-white/10 p-4 font-mono text-[12.5px] leading-relaxed text-on-surface focus:outline-none focus:border-primary/40 resize-y"
            />
          </SectionCard>
        )}

        {/* AI Intelligence Summary */}
        <SectionCard title="AI Intelligence Summary" icon="auto_awesome" status={aiStatus}>
          {evidence.aiSummary ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-container/60 border border-white/5">
                  <RiskScore value={evidence.aiSummary.riskScore} />
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-on-surface-variant">
                      Risk Score
                    </p>
                    <p className="text-sm text-on-surface mt-1">
                      Composite risk derived from FIR text, repeat-offender match, and crime
                      pattern clustering.
                    </p>
                  </div>
                </div>

                <div>
                  <SubLabel>Key Entities Detected</SubLabel>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {evidence.aiSummary.entities.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => dispatchEntity(e)}
                        className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-primary-container/40 border border-primary/20 text-xs text-on-surface hover:bg-primary-container/70 hover:border-primary/40 transition-colors"
                        title={e.meta ?? e.type}
                      >
                        <span className="material-symbols-outlined text-[14px] text-primary">
                          {ENTITY_ICON[e.type]}
                        </span>
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <SubLabel>IPC Sections</SubLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {evidence.aiSummary.ipcSections.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center px-2.5 h-7 rounded-md bg-surface-container-high text-xs font-mono text-on-surface border border-white/5"
                        >
                          IPC {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SubLabel>Keywords</SubLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {evidence.aiSummary.keywords.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center px-2.5 h-7 rounded-md bg-surface-container/80 text-xs text-on-surface-variant border border-white/5"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <SubLabel>Officer Recommendation</SubLabel>
                  <p className="text-sm text-on-surface mt-2 leading-relaxed">
                    {evidence.aiSummary.recommendation}
                  </p>
                </div>

                <button
                  onClick={handleContinueInvestigation}
                  className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-primary-container text-on-primary-container text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-primary/10"
                >
                  Continue Investigation
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>

              <div className="rounded-xl p-5 bg-gradient-to-b from-primary-container/20 to-surface-container/40 border border-primary/15 space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                  CrimeSight Intelligence
                </p>
                <div>
                  <SubLabel>Threat Level</SubLabel>
                  <ThreatPill level={evidence.aiSummary.crimeSight.threatLevel} />
                </div>
                <div>
                  <SubLabel>Crime Pattern</SubLabel>
                  <p className="text-sm text-on-surface mt-1.5">
                    {evidence.aiSummary.crimeSight.crimePattern}
                  </p>
                </div>
                <div>
                  <SubLabel>Repeat Offender Match</SubLabel>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-sm text-on-surface font-medium">
                      {evidence.aiSummary.crimeSight.repeatOffenderMatch.name}
                    </span>
                    <span className="text-xs font-mono text-primary">
                      {evidence.aiSummary.crimeSight.repeatOffenderMatch.confidence}% match
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container/60 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider">
                      Related FIRs
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-on-surface tabular-nums">
                    {evidence.aiSummary.crimeSight.relatedFIRCount}
                  </span>
                </div>
                <div>
                  <SubLabel>Suggested Patrol Action</SubLabel>
                  <p className="text-xs text-on-surface mt-1.5 leading-relaxed">
                    {evidence.aiSummary.crimeSight.suggestedPatrolAction}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Placeholder
              icon="auto_awesome"
              text={
                evidence.ocr
                  ? "Generating AI intelligence summary..."
                  : "Waiting for OCR..."
              }
            />
          )}
        </SectionCard>

        {/* Timeline */}
        <SectionCard title="Evidence Timeline" icon="timeline" status={timelineStatus}>
          {evidence.timeline.length > 0 ? (
            <Timeline entries={evidence.timeline} />
          ) : (
            <Placeholder icon="timeline" text="Waiting..." />
          )}
        </SectionCard>

        {/* Actions */}
        {evidence.ocr && (
          <div className="glass-card rounded-2xl p-5 flex flex-wrap gap-3 animate-entrance">
            <ActionButton onClick={handleSave} icon="save" primary>
              Save to Database
            </ActionButton>
            <ActionButton onClick={handleGenerateCaseBrief} icon="auto_stories">
              Generate AI Case Brief
            </ActionButton>
            <ActionButton onClick={handleRelatedCases} icon="hub">
              View Related Cases
            </ActionButton>
            <ActionButton onClick={handleGenerateSummary} icon="summarize">
              Generate Intelligence Summary
            </ActionButton>
            <ActionButton onClick={handleContinueInvestigation} icon="arrow_forward">
              Continue Investigation
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CardStatus }) {
  const map: Record<CardStatus, { label: string; cls: string; icon: string }> = {
    pending: {
      label: "Pending",
      cls: "bg-white/5 text-on-surface-variant border-white/10",
      icon: "schedule",
    },
    completed: {
      label: "Completed",
      cls: "bg-green-500/10 text-green-300 border-green-400/20",
      icon: "check_circle",
    },
    ai: {
      label: "AI Generated",
      cls: "bg-primary-container/40 text-primary border-primary/30",
      icon: "auto_awesome",
    },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 h-6 rounded-full border text-[10px] font-semibold uppercase tracking-wider",
        m.cls,
      )}
    >
      <span className="material-symbols-outlined text-[13px]">{m.icon}</span>
      {m.label}
    </span>
  );
}

function SectionCard({
  title,
  icon,
  status,
  caption,
  children,
  compact,
}: {
  title: string;
  icon: string;
  status: CardStatus;
  caption?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={cn("glass-card rounded-2xl animate-entrance", compact ? "p-4" : "p-5")}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary">{icon}</span>
          <div>
            <h2 className="text-base font-bold text-on-surface">{title}</h2>
            {caption && <p className="text-[11px] text-on-surface-variant mt-0.5">{caption}</p>}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      {children}
    </section>
  );
}

function PipelineBadge({ stage }: { stage: Stage }) {
  const order = PIPELINE_STAGES.map((s) => s.id);
  const currentIdx = order.indexOf(stage);
  return (
    <div className="glass-card rounded-xl px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold mb-2">
        AI Processing Pipeline
      </p>
      <div className="flex items-center gap-1 flex-wrap">
        {PIPELINE_STAGES.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium transition-all",
                  done && "bg-primary-container/60 text-on-primary-container",
                  active && "bg-primary/20 text-primary ring-2 ring-primary/40 pulse-dot",
                  !done && !active && "bg-white/5 text-on-surface-variant",
                )}
              >
                {done && <span className="material-symbols-outlined text-[13px]">check</span>}
                {s.label}
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <span className="material-symbols-outlined text-[14px] text-outline-variant">
                  chevron_right
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProcessingStepper({
  current,
  uploadProgress,
}: {
  current: ProcessingStep;
  uploadProgress: number;
}) {
  const order = PROCESSING_STEPS.map((s) => s.id);
  const currentIdx = order.indexOf(current);
  return (
    <div className="mt-4 rounded-lg p-4 bg-surface-container/60 border border-white/5">
      {current === "uploading" && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1.5 font-mono uppercase tracking-wider">
            <span>Uploading</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}
      <ul className="space-y-1.5">
        {PROCESSING_STEPS.map((s, i) => {
          const done = i < currentIdx || current === "done";
          const active = i === currentIdx && current !== "done";
          const pending = i > currentIdx;
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-2.5 text-sm transition-colors",
                done && "text-green-300",
                active && "text-on-surface",
                pending && "text-on-surface-variant/60",
              )}
            >
              {done ? (
                <span className="material-symbols-outlined text-[16px] text-green-400">
                  check_circle
                </span>
              ) : active ? (
                <span className="material-symbols-outlined text-[16px] text-primary animate-spin">
                  progress_activity
                </span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">circle</span>
              )}
              <span className={cn(active && "font-medium")}>{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RecentStatusPill({ status }: { status: "Completed" | "Pending" | "AI Flagged" }) {
  const cls =
    status === "Completed"
      ? "bg-green-500/10 text-green-300 border-green-400/20"
      : status === "Pending"
      ? "bg-amber-500/10 text-amber-300 border-amber-400/20"
      : "bg-red-500/10 text-red-300 border-red-400/20";
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center px-2 h-5 rounded-full border text-[9px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <section className="glass-card rounded-2xl p-10 text-center animate-entrance">
      <span className="material-symbols-outlined text-[56px] text-on-surface-variant/60">
        folder_open
      </span>
      <h3 className="mt-3 text-base font-semibold text-on-surface">No evidence uploaded yet.</h3>
      <p className="text-sm text-on-surface-variant mt-1.5 max-w-md mx-auto">
        Upload an FIR or crime scene document to begin AI analysis.
      </p>
    </section>
  );
}

function Placeholder({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded-lg p-8 text-center bg-surface-container/40 border border-dashed border-white/10">
      <span className="material-symbols-outlined text-[32px] text-on-surface-variant/50">
        {icon}
      </span>
      <p className="text-sm text-on-surface-variant mt-2">{text}</p>
    </div>
  );
}

function InfoCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-4 bg-surface-container/60 border border-white/5 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
        <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className={cn("text-sm text-on-surface", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
      {children}
    </p>
  );
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
          <circle
            cx="40"
            cy="40"
            r={r}
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="text-primary transition-all"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-on-surface tabular-nums">{value}%</span>
        </div>
      </div>
    </div>
  );
}

function RiskScore({ value }: { value: number }) {
  const tone =
    value >= 75
      ? "text-red-300 border-red-400/30 bg-red-500/10"
      : value >= 50
      ? "text-amber-300 border-amber-400/30 bg-amber-500/10"
      : "text-green-300 border-green-400/30 bg-green-500/10";
  return (
    <div
      className={cn(
        "w-16 h-16 rounded-xl border flex flex-col items-center justify-center shrink-0",
        tone,
      )}
    >
      <span className="text-xl font-bold tabular-nums leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-wider mt-1 opacity-80">/100</span>
    </div>
  );
}

function ThreatPill({ level }: { level: "Low" | "Moderate" | "High" }) {
  const cls =
    level === "High"
      ? "bg-red-500/15 text-red-300 border-red-400/30 pulse-red"
      : level === "Moderate"
      ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
      : "bg-green-500/15 text-green-300 border-green-400/30";
  return (
    <span
      className={cn(
        "mt-1.5 inline-flex items-center gap-1.5 px-3 h-7 rounded-full border text-xs font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      <span className="material-symbols-outlined text-[14px]">crisis_alert</span>
      {level}
    </span>
  );
}

function Timeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="relative border-l border-white/10 ml-3 space-y-5">
      {entries.map((e, i) => {
        const isLast = i === entries.length - 1;
        return (
          <li key={i} className="ml-5">
            <span
              className={cn(
                "absolute -left-[7px] w-3.5 h-3.5 rounded-full border-2 border-surface-container",
                isLast ? "bg-primary pulse-dot" : "bg-primary-container",
              )}
            />
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-on-surface-variant w-12">{e.time}</span>
              <span className="text-sm text-on-surface font-medium">{e.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ActionButton({
  onClick,
  icon,
  primary,
  children,
}: {
  onClick: () => void;
  icon: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-semibold transition-colors",
        primary
          ? "bg-primary-container text-on-primary-container hover:opacity-90"
          : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/5",
      )}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {children}
    </button>
  );
}
