import { NavLink } from "react-router-dom";
import { api } from "@/services/api";
import { useApi } from "@/hooks/useApi";

const NAV = [
  { label: "Intelligence", to: "/", end: true },
  { label: "Investigations", to: "/brief", end: false },
  { label: "Network Analysis", to: "/network", end: false },
  { label: "Evidence Upload", to: "/evidence", end: false },
  { label: "Intelligence Reports", to: "/reports", end: false },
];

const TODAY = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function AppHeader() {
  const { data, loading, error } = useApi(() => api.getOfficer(), []);

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-highest/80 backdrop-blur-3xl border-b border-white/5 flex justify-between items-center px-6 h-16">
      <div className="flex items-center gap-10">
        <h1 className="text-[22px] font-bold text-primary tracking-tighter">CrimeSight AI</h1>
        <nav className="hidden md:flex gap-8 items-center h-full">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? "text-sm text-primary border-b border-primary pb-1 font-medium"
                  : "text-sm text-on-surface-variant hover:text-on-surface transition-colors pb-1 font-medium"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-all" aria-label="Notifications">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">notifications</span>
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/5 transition-all" aria-label="Settings">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">settings</span>
          </button>
        </div>
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right min-w-[180px]">
            {loading ? (
              <>
                <div className="h-3.5 w-44 ml-auto rounded bg-white/10 animate-pulse" />
                <div className="h-2.5 w-32 ml-auto mt-1.5 rounded bg-white/5 animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-on-surface leading-tight">
                  Good Morning, {data?.rank} {data?.full_name}
                  {error && <span title={error} className="ml-1.5 text-[9px] text-orange-400 font-mono uppercase">offline</span>}
                </p>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-medium">
                  {data?.district} · {TODAY}
                </p>
              </>
            )}
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden border border-primary/30 ring-2 ring-primary/10 bg-surface-variant/40">
            {!loading && data?.profile_image && (
              <img alt={data.full_name} className="w-full h-full object-cover" src={data.profile_image} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
