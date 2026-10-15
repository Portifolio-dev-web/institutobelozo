import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentCard } from "@/components/admin/AppointmentCard";
import { DayView, WeekView, KanbanView } from "@/components/admin/AgendaViews";
import { Occupancy } from "@/components/admin/Occupancy";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { todayISO, addDays, weekStart, fmtLong, fmtDate } from "@/lib/format";

const VIEWS = [["day", "Dia"], ["week", "Semana"], ["kanban", "Kanban"]];

const SlaPanel = ({ summary, onChanged }) => {
  const list = summary?.pending_list || [];
  if (!list.length) return null;
  return (
    <section className={`rounded-2xl border p-5 space-y-4 ${summary.overdue ? "border-[#DC2626] bg-[#FEF2F2]" : "bg-white"}`} data-testid="admin-sla-alert-card">
      <p className={`flex items-center gap-2 font-display font-semibold ${summary.overdue ? "text-[#DC2626]" : ""}`}>
        <AlertTriangle className="w-4 h-4" /> {list.length} pedido(s) aguardando resposta{summary.overdue ? ` · ${summary.overdue} com SLA de 1h estourado` : ""}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((a) => <AppointmentCard key={a.id} a={a} onChanged={onChanged} showDate />)}
      </div>
    </section>
  );
};

export default function AgendaPage() {
  const { user } = useAuth();
  const { summary, refreshSummary } = useOutletContext();
  const [view, setView] = useState("day");
  const [anchor, setAnchor] = useState(todayISO());
  const [profFilter, setProfFilter] = useState("all");
  const [data, setData] = useState({ appts: [], occ: [], profs: [] });

  const start = view === "day" ? anchor : weekStart(anchor);
  const days = view === "day" ? 1 : 7;
  const load = useCallback(async () => {
    const pf = profFilter === "all" ? undefined : profFilter;
    const [a, o, p] = await Promise.all([
      api.get("/admin/appointments", { params: { start, end: addDays(start, days - 1), professional_id: pf } }),
      api.get("/admin/occupancy", { params: { start, days } }),
      api.get("/admin/professionals"),
    ]);
    const keep = (x) => !pf || x === pf;
    setData({ appts: a.data, occ: o.data.filter((r) => keep(r.professional_id)), profs: p.data.filter((x) => x.active && keep(x.id)) });
  }, [start, days, profFilter]);
  useEffect(() => { load(); }, [load]);
  const onChanged = () => { load(); refreshSummary(); };
  const step = (n) => setAnchor(addDays(anchor, n * days));

  return (
    <div className="space-y-8" data-testid="admin-agenda-page">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight first-letter:uppercase" data-testid="agenda-range-title">
            {view === "day" ? fmtLong(anchor) : `${fmtDate(start)} – ${fmtDate(addDays(start, 6))}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full bg-white border p-1">
            {VIEWS.map(([v, l]) => <button key={v} onClick={() => setView(v)} data-testid={`agenda-view-${v}`} className={`px-4 py-1.5 rounded-full text-sm transition-colors ${view === v ? "bg-moss text-cream" : "hover:text-moss"}`}>{l}</button>)}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white border p-1">
            <button onClick={() => step(-1)} className="p-1.5 rounded-full hover:bg-moss/10" data-testid="agenda-prev"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setAnchor(todayISO())} className="px-3 text-sm" data-testid="agenda-today">Hoje</button>
            <button onClick={() => step(1)} className="p-1.5 rounded-full hover:bg-moss/10" data-testid="agenda-next"><ChevronRight className="w-4 h-4" /></button>
          </div>
          {user.role === "admin" && (
            <Select value={profFilter} onValueChange={setProfFilter}>
              <SelectTrigger className="w-[200px] rounded-full bg-white" data-testid="agenda-prof-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                <ProfOptions />
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <SlaPanel summary={summary} onChanged={onChanged} />
      <Occupancy rows={data.occ} />
      {view === "day" && <DayView date={anchor} appts={data.appts} profs={data.profs} onChanged={onChanged} />}
      {view === "week" && <WeekView start={start} appts={data.appts} occupancy={data.occ} onChanged={onChanged} />}
      {view === "kanban" && <KanbanView appts={data.appts} onChanged={onChanged} />}
    </div>
  );
}

const ProfOptions = () => {
  const [profs, setProfs] = useState([]);
  useEffect(() => { api.get("/admin/professionals").then((r) => setProfs(r.data.filter((p) => p.active))); }, []);
  return profs.map((p) => <SelectItem key={p.id} value={p.id} data-testid={`agenda-prof-option-${p.id}`}>{p.name}</SelectItem>);
};
