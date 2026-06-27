import { Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OfflineBanner } from "@/components/OfflineBanner";

import Dashboard from "@/pages/Dashboard";
import EvidenceUpload from "@/pages/EvidenceUpload";
import MorningBrief from "@/pages/MorningBrief";
import NetworkPage from "@/pages/NetworkPage";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/NotFound";

// Single-page React Router shell. Each page mounts its own <AppHeader />
// so individual layouts (full-bleed, two-pane, scrolling) are preserved
// without forcing every page through a shared wrapper.
export default function App() {
  return (
    <HashRouter>
      <ErrorBoundary>
        <OfflineBanner />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/evidence" element={<EvidenceUpload />} />
            <Route path="/brief" element={<MorningBrief />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </HashRouter>
  );
}
