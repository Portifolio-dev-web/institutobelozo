import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { CalendarDays, Users, Clock, UserCog, Bell, LogOut, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const NAV = [
  ["/admin", "Agenda", CalendarDays, true],
  ["/admin/clientes", "Clientes & Prontuários", Users],
  ["/admin/grade", "Grade de horários", Clock],
  ["/admin/equipe", "Equipe & Serviços", UserCog, false, true],
  ["/admin/notificacoes", "Notificações", Bell],
];

const SlaCounter = ({ summary }) => {
  const late = summary?.overdue || 0;
  return (
    <div data-testid="admin-sla-counter" className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${late ? "bg-[#DC2626] text-white animate-pulse" : "bg-moss/10 text-moss"}`}>
      <AlertTriangle className="w-4 h-4" />
      <span>{late} atrasado{late === 1 ? "" : "s"} (SLA 1h)</span>
      <span className="opacity-70">· {summary?.pending || 0} pendentes</span>
    </div>
  );
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [summary, setSummary] = useState(null);
  const refresh = useCallback(() => api.get("/admin/summary").then((r) => setSummary(r.data)).catch(() => {}), []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);
  const items = NAV.filter((n) => !n[4] || user.role === "admin");

  return (
    <div className="min-h-screen bg-[#F2F1EC] lg:grid lg:grid-cols-[260px,1fr]" data-testid="admin-layout">
      <aside className="bg-charcoal text-cream/80 lg:min-h-screen lg:sticky lg:top-0 lg:h-screen flex lg:flex-col">
        <Link to="/" className="hidden lg:flex items-baseline gap-2 px-8 py-8 text-cream" data-testid="admin-logo"><span className="font-display font-semibold">Instituto</span><span className="font-serif italic text-xl text-gold">Belozo</span></Link>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto px-3 lg:px-4 py-3 lg:py-0 flex-1">
          {items.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} data-testid={`admin-nav-${to.split("/")[2] || "agenda"}`}
              className={({ isActive }) => `flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition-colors ${isActive ? "bg-moss text-cream" : "hover:bg-cream/5"}`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block p-6 border-t border-cream/10 text-xs">
          <p className="text-cream" data-testid="admin-user-name">{user.name}</p>
          <p className="opacity-60">{user.role === "admin" ? "Administrador" : "Profissional"}</p>
          <button onClick={() => { logout(); nav("/"); }} className="mt-4 inline-flex items-center gap-2 hover:text-cream" data-testid="admin-logout-button"><LogOut className="w-4 h-4" />Sair</button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 bg-[#F2F1EC]/90 backdrop-blur-xl border-b px-5 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-display font-medium">Painel da equipe</p>
          <div className="flex items-center gap-3">
            <SlaCounter summary={summary} />
            <button onClick={() => { logout(); nav("/"); }} className="lg:hidden" data-testid="admin-mobile-logout-button"><LogOut className="w-4 h-4" /></button>
          </div>
        </header>
        <main className="px-5 sm:px-10 py-8 lg:py-10">
          <Outlet context={{ summary, refreshSummary: refresh }} />
        </main>
      </div>
    </div>
  );
}
