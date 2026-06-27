import { useEffect, useState } from "react";
import { onOfflineChange } from "@/services/api";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    return onOfflineChange(setOffline);
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-16 left-1/2 z-40 -translate-x-1/2">
      <div className="glass-card rounded-full border-orange-400/30 bg-orange-400/10 px-4 py-1.5 shadow-lg">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-orange-300">
          <span className="material-symbols-outlined text-[14px]">cloud_off</span>
          Catalyst unreachable · showing cached intelligence
        </p>
      </div>
    </div>
  );
}
