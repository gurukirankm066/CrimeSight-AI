
## Goal

Replace TanStack Start with a plain **React 19 + Vite SPA (TypeScript)** deployable as static assets to **Zoho Catalyst AppSail**. Backend already exists in Catalyst — frontend talks to it only via `VITE_API_BASE_URL`. Visual identity and existing user workflows are preserved exactly. Architectural migration, not a UI redesign.

---

## 1. Migration safety rules (mandatory)

- Do not rewrite components that already work. Prefer **copying existing code**.
- Preserve all existing styling, Tailwind classes, animations, spacing, typography, colors, icons, and component hierarchy.
- Preserve existing API response interfaces and TypeScript types.
- Preserve existing mock data and fallback behavior.
- Preserve existing PDF export, Three.js graph, and Karnataka map implementations unless deployment compatibility forces a change.
- Do not simplify, redesign, or replace complex UI sections with placeholders.
- Reuse existing components instead of generating new ones.
- Each migrated page must remain visually and functionally equivalent before the next page is started.
- After each page is migrated, run `npm run build` and fix every TS/ESLint/Vite error before continuing.
- No existing file is deleted until its replacement compiles.

---

## 2. Migration order

1. Install new deps.
2. Create `index.html`, `src/main.tsx`, `src/App.tsx`, new `vite.config.ts`, `tsconfig` adjustments.
3. Create `src/services/api.ts` (copy current, keep interfaces + mocks, add offline pub/sub + FormData upload helper).
4. Create resilience components (`ErrorBoundary`, `LoadingScreen`, `OfflineBanner`, `NotFound`).
5. Copy `AppHeader.tsx` and shared components; swap TanStack `<Link>` → `react-router-dom` `<NavLink>` only.
6. Migrate pages one at a time, copying current route bodies verbatim into `src/pages/<Name>.tsx`. Order: Dashboard → EvidenceUpload → MorningBrief → NetworkPage → Reports → NotFound. Build green after each.
7. Only after every page renders identically and build is green: remove TanStack Start, TanStack Router, `@lovable.dev/vite-tanstack-config`, Nitro, H3, `src/routes/`, `src/routeTree.gen.ts`, `src/router.tsx`, `src/server.ts`, `src/start.ts`, `src/lib/error-*.ts`, old `vite.config.ts`.

---

## 3. Dependencies

**Keep**: react, react-dom, typescript, @tanstack/react-query, recharts, lucide-react, tailwindcss v4, @tailwindcss/vite, three, sonner, clsx, class-variance-authority, tailwind-merge, all Radix/shadcn primitives.

**Add**: react-router-dom@^7, leaflet, react-leaflet, @types/leaflet, @vitejs/plugin-react.

**Remove (last step only)**: @tanstack/react-start, @tanstack/react-router, @tanstack/router-*, @lovable.dev/vite-tanstack-config, nitropack, h3, TanStack Start devtools.

---

## 4. Structure

```text
index.html
vite.config.ts
.env.example
DEPLOY.md
src/
  main.tsx
  App.tsx
  index.css
  components/  (AppHeader, ErrorBoundary, LoadingScreen, OfflineBanner,
                NetworkGraph, KarnatakaMap, EvidenceTimeline, UploadProgress,
                AIRecommendationCard, ConfidenceRing, ui/)
  pages/       (Dashboard, EvidenceUpload, MorningBrief, NetworkPage, Reports, NotFound)
  services/api.ts
  hooks/useApi.ts
  assets/
```

---

## 5. Routing — React Router v7

```tsx
<BrowserRouter>
  <ErrorBoundary>
    <AppHeader />
    <OfflineBanner />
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/evidence"  element={<EvidenceUpload />} />
        <Route path="/brief"     element={<MorningBrief />} />
        <Route path="/network"   element={<NetworkPage />} />
        <Route path="/reports"   element={<Reports />} />
        <Route path="*"          element={<NotFound />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
</BrowserRouter>
```

`HashRouter` is a one-line fallback if AppSail rewrites aren't available.

---

## 6. React Query

```ts
new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000, refetchOnWindowFocus: false } },
});
```

---

## 7. API layer — `src/services/api.ts`

Copy current file, keep all interfaces and mocks. Add `VITE_API_BASE_URL`, offline pub/sub, and FormData upload helper. **Do not set `Content-Type` for FormData** — the browser must generate the multipart boundary.

```ts
const BASE = import.meta.env.VITE_API_BASE_URL;
let offline = false;
const listeners = new Set<(o: boolean) => void>();
export const onOfflineChange = (cb: (o: boolean) => void) => { listeners.add(cb); return () => listeners.delete(cb); };
function setOffline(v: boolean) { if (offline !== v) { offline = v; listeners.forEach(l => l(v)); } }

async function call<T>(path: string, init?: RequestInit, mock?: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}/${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      ...init,
    });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    setOffline(false); return res.json();
  } catch (e) { if (mock !== undefined) { setOffline(true); return mock; } throw e; }
}

async function upload<T>(path: string, file: File, mock?: T): Promise<T> {
  const fd = new FormData(); fd.append("file", file);
  try {
    const res = await fetch(`${BASE}/${path}`, { method: "POST", credentials: "include", body: fd });
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    setOffline(false); return res.json();
  } catch (e) { if (mock !== undefined) { setOffline(true); return mock; } throw e; }
}

export const api = {
  getOfficer:           () => call("get_officer_profile/", undefined, MOCK_OFFICER),
  getDistrictDashboard: () => call("get_district_dashboard/", undefined, MOCK_DASHBOARD),
  getMorningBrief:      () => call("generate_brief/", undefined, MOCK_BRIEF),
  getNetworkGraph:      () => call("get_network_graph/", undefined, MOCK_NETWORK),
  getRepeatOffenders:   () => call("get_repeat_offenders/", undefined, MOCK_REPEAT),
  getVictimAnalysis:    () => call("get_victim_analysis/", undefined, MOCK_VICTIM),
  generateAiSummary:    (p: unknown) => call("generate_ai_summary/", { method: "POST", body: JSON.stringify(p) }, MOCK_SUMMARY),
  uploadEvidence:       (file: File) => upload("upload_evidence/", file, MOCK_OCR),
};
```

`.env.example`:

```text
VITE_API_BASE_URL=https://crimesightai-60075226836.development.catalystserverless.in/server
```

---

## 8. Resilience

- **ErrorBoundary** wraps `<Routes>` and integrates `QueryErrorResetBoundary`.
- **LoadingScreen** for `Suspense` fallback and Query `isLoading`.
- **OfflineBanner** subscribes to `onOfflineChange`.
- **NotFound** themed 404 with "Return to Intelligence" CTA.

---

## 9. Page ports (1:1, copy verbatim)

Each page = literal copy of current route file body minus `createFileRoute`. No simplification, no placeholders. All complex UI (evidence stepper, OCR preview, entity chips, timeline, recommendation cards, three.js graph, PDF preview/export, reports schedule/history) copied exactly. Design tokens, glass utilities, and `animate-entrance` keyframes preserved.

---

## 10. Map configuration

Reuse current Karnataka map. Switch to Leaflet only if deployment forces it; tile config then reads from `VITE_MAP_TILE_URL`, `VITE_MAP_TILE_ATTRIBUTION`, `VITE_MAP_MAX_ZOOM`. No hardcoded provider.

---

## 11. Build & deploy

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: "dist", sourcemap: true },
});
```

`package.json`:

```json
"dev": "vite",
"build": "tsc --noEmit && vite build",
"preview": "vite preview"
```

`DEPLOY.md` includes AppSail steps, env vars, SPA rewrite, `HashRouter` fallback, and a post-deploy verification checklist (root URL loads; refresh works on every route; `/network`, `/reports`, `/evidence`, `/brief` deep-links don't 404; `OfflineBanner` appears when `VITE_API_BASE_URL` is unreachable).

---

## 12. Final verification (mandatory)

**Build**: `npm install`, `npm run build`, `npm run dev` succeed. Zero TS, Vite, and ESLint errors or warnings.
**Functional** (each page — Dashboard, Evidence Upload, Morning Brief, Network Graph, Reports): navigation works; browser refresh works on every route; direct deep-link navigation works; no blank pages, hydration errors, or missing assets; **no runtime errors in the browser console after loading every page.**
**API**: every network request originates from `src/services/api.ts`; no component calls `fetch()` directly.
**Deployment**: `dist/` contains only static assets; no Node server required; no SSR, Nitro, H3, or TanStack Start runtime files remain.
**Final cleanup** (only after the above passes): remove unused deps, dead files, unused imports, obsolete config; run one final production build to confirm it is still green.

---

## 13. Migration guardrails

- **Lock versions** — do not upgrade major versions of existing packages unless required to remove TanStack Start.
- **Incremental checkpoints** — create a checkpoint after each successfully migrated page before proceeding.
- **Protect component APIs** — preserve props, return shapes, and exported interfaces unless a routing change strictly requires modification.
- **Preserve file organization** — minimal moves; prefer keeping a file in place over reorganizing.
- **Protect environment variables** — all runtime configuration comes from env vars; no Catalyst URLs, tokens, or secrets hardcoded outside `.env.example`.

---

## 14. Definition of Done (mandatory)

The migration is complete only when **all** of the following are true:

- `npm install`, `npm run build`, and `npm run dev` all succeed.
- Every page renders correctly with no visual regressions.
- Existing layouts, animations, spacing, typography, colors, icons, and interactions are preserved.
- All existing workflows function as before, except for changes explicitly required for deployment compatibility.
- The project contains no remaining runtime dependency on TanStack Start, Nitro, H3, server-side rendering, or a custom Node server.
- The application can be deployed as static assets to Zoho Catalyst AppSail.
- Every API request is routed through `src/services/api.ts`.
- No runtime errors or warnings appear in the browser console.
- No TypeScript, ESLint, or Vite errors remain.
- No new `TODO` items are introduced except for backend integrations explicitly marked as future work.
- The generated code is production-ready and does not require manual fixes to compile or deploy.

The migration must not be marked complete until every item above has been verified.

---

## Out of scope

Backend, Express, Node server, SSR, Nitro, H3, real OCR/QuickML/RAG, auth changes.
